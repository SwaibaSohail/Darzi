import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest'
import { createServer, type Server as HttpServer } from 'node:http'
import { io as clientIo, type Socket as ClientSocket } from 'socket.io-client'
import request from 'supertest'

const store = new Map<string, Record<string, unknown>>()
const subStore = new Map<string, Record<string, unknown>>() // orders/{id}/messages/{mid}
let autoId = 0

function messagesCollection(orderId: string) {
  const prefix = `orders/${orderId}/messages/`
  return {
    doc: (id?: string) => {
      const docId = id ?? `m${++autoId}`
      const key = `${prefix}${docId}`
      return {
        id: docId,
        set: async (data: Record<string, unknown>) => void subStore.set(key, data),
        get: async () => ({ id: docId, exists: subStore.has(key), data: () => subStore.get(key) }),
      }
    },
    orderBy: () => ({
      get: async () => ({
        docs: [...subStore.entries()]
          .filter(([k]) => k.startsWith(prefix))
          .map(([k, v]) => ({ id: k.slice(prefix.length), data: () => v })),
      }),
    }),
  }
}

const fakeDb = {
  collection: (name: string) => ({
    where: () => ({ get: async () => ({ docs: [] }) }),
    orderBy: () => ({ get: async () => ({ docs: [] }) }),
    get: async () => ({ docs: [] }),
    doc: (id?: string) => {
      const docId = id ?? `gen${++autoId}`
      const key = `${name}/${docId}`
      return {
        id: docId,
        get: async () => ({ id: docId, exists: store.has(key), data: () => store.get(key) }),
        set: async (data: Record<string, unknown>) => void store.set(key, data),
        update: async (data: Record<string, unknown>) => {
          store.set(key, { ...store.get(key), ...data })
        },
        collection: (sub: string) => {
          if (sub !== 'messages') throw new Error('unexpected subcollection')
          return messagesCollection(docId)
        },
      }
    },
  }),
}

vi.mock('../../config/firebase.js', () => ({
  getAuthAdmin: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'owner-token') return { uid: 'owner', email: 'o@t.c' }
      if (token === 'other-token') return { uid: 'other', email: 'x@t.c' }
      if (token === 'admin-token') return { uid: 'adm', email: 's@t.c', admin: true }
      throw new Error('bad')
    },
    getUser: async () => null,
  }),
  getDb: () => fakeDb,
  serverTimestamp: () => 'ts',
}))

const { initIo } = await import('../../sockets/io.js')
const { default: app } = await import('../../app.js')

let httpServer: HttpServer
let port: number

function connect(token: string): ClientSocket {
  return clientIo(`http://localhost:${port}`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: false,
  })
}

function waitConnect(socket: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve())
    socket.on('connect_error', reject)
  })
}

function emitAck<T>(socket: ClientSocket, event: string, payload: unknown): Promise<T> {
  return new Promise((resolve) => socket.emit(event, payload, resolve))
}

function seedOrder(id: string, userId = 'owner') {
  store.set(`orders/${id}`, {
    userId,
    number: 'DRZ-2607-CHAT',
    items: [],
    amounts: { subtotal: 0, delivery: 0, total: 0 },
    status: 'placed',
    timeline: [],
    address: {},
    paymentMethod: 'cod',
    unread: { customer: 0, admin: 0 },
  })
}

beforeAll(async () => {
  httpServer = createServer()
  initIo(httpServer)
  await new Promise<void>((resolve) => httpServer.listen(0, resolve))
  const addr = httpServer.address()
  port = typeof addr === 'object' && addr ? addr.port : 0
})

afterAll(() => {
  httpServer.close()
})

beforeEach(() => {
  store.clear()
  subStore.clear()
})

describe('chat rooms', () => {
  it('rejects joining someone else\'s order', async () => {
    seedOrder('o1', 'owner')
    const socket = connect('other-token')
    await waitConnect(socket)
    const res = await emitAck<{ ok: boolean }>(socket, 'chat:join', { orderId: 'o1' })
    expect(res.ok).toBe(false)
    socket.close()
  })

  it('lets owner and admin join', async () => {
    seedOrder('o1', 'owner')
    const owner = connect('owner-token')
    const admin = connect('admin-token')
    await Promise.all([waitConnect(owner), waitConnect(admin)])
    expect((await emitAck<{ ok: boolean }>(owner, 'chat:join', { orderId: 'o1' })).ok).toBe(true)
    expect((await emitAck<{ ok: boolean }>(admin, 'chat:join', { orderId: 'o1' })).ok).toBe(true)
    owner.close()
    admin.close()
  })

  it('blocks sending before joining', async () => {
    seedOrder('o1', 'owner')
    const socket = connect('owner-token')
    await waitConnect(socket)
    const res = await emitAck<{ ok: boolean; error?: string }>(socket, 'chat:send', {
      orderId: 'o1',
      text: 'hello',
    })
    expect(res.ok).toBe(false)
    socket.close()
  })
})

describe('message roundtrip', () => {
  it('persists, delivers to the room, and bumps the counterpart unread counter', async () => {
    seedOrder('o1', 'owner')
    const owner = connect('owner-token')
    const admin = connect('admin-token')
    const outsider = connect('other-token')
    await Promise.all([waitConnect(owner), waitConnect(admin), waitConnect(outsider)])
    await emitAck(owner, 'chat:join', { orderId: 'o1' })
    await emitAck(admin, 'chat:join', { orderId: 'o1' })

    let outsiderGotMessage = false
    outsider.on('chat:message', () => {
      outsiderGotMessage = true
    })

    const adminReceived = new Promise<{ message: { text: string; senderRole: string } }>(
      (resolve) => admin.on('chat:message', resolve),
    )

    const ack = await emitAck<{ ok: boolean }>(owner, 'chat:send', {
      orderId: 'o1',
      text: 'Salam, can the sleeves be shorter?',
    })
    expect(ack.ok).toBe(true)

    const received = await adminReceived
    expect(received.message.text).toBe('Salam, can the sleeves be shorter?')
    expect(received.message.senderRole).toBe('customer')

    // persisted
    expect([...subStore.keys()].filter((k) => k.startsWith('orders/o1/messages/'))).toHaveLength(1)
    // unread for admin bumped
    expect((store.get('orders/o1') as { unread: { admin: number } }).unread.admin).toBe(1)
    // room isolation
    await new Promise((r) => setTimeout(r, 100))
    expect(outsiderGotMessage).toBe(false)

    owner.close()
    admin.close()
    outsider.close()
  })

  it('rate limits after 10 messages in the window', async () => {
    seedOrder('o1', 'owner')
    const owner = connect('owner-token')
    await waitConnect(owner)
    await emitAck(owner, 'chat:join', { orderId: 'o1' })
    for (let i = 0; i < 10; i++) {
      const ack = await emitAck<{ ok: boolean }>(owner, 'chat:send', { orderId: 'o1', text: `m${i}` })
      expect(ack.ok).toBe(true)
    }
    const eleventh = await emitAck<{ ok: boolean; error?: string }>(owner, 'chat:send', {
      orderId: 'o1',
      text: 'm11',
    })
    expect(eleventh.ok).toBe(false)
    expect(eleventh.error).toMatch(/slow down/i)
    owner.close()
  })

  it('rejects oversized messages', async () => {
    seedOrder('o1', 'owner')
    const owner = connect('owner-token')
    await waitConnect(owner)
    await emitAck(owner, 'chat:join', { orderId: 'o1' })
    const ack = await emitAck<{ ok: boolean }>(owner, 'chat:send', {
      orderId: 'o1',
      text: 'x'.repeat(2001),
    })
    expect(ack.ok).toBe(false)
    owner.close()
  })
})

describe('chat REST', () => {
  it('returns history to owner and admin, 404 to others', async () => {
    seedOrder('o1', 'owner')
    subStore.set('orders/o1/messages/m1', {
      senderId: 'owner',
      senderRole: 'customer',
      text: 'hello',
      createdAt: 'ts',
    })
    const owner = await request(app)
      .get('/api/orders/o1/messages')
      .set('Authorization', 'Bearer owner-token')
    expect(owner.status).toBe(200)
    expect(owner.body.items).toHaveLength(1)
    const admin = await request(app)
      .get('/api/orders/o1/messages')
      .set('Authorization', 'Bearer admin-token')
    expect(admin.status).toBe(200)
    const other = await request(app)
      .get('/api/orders/o1/messages')
      .set('Authorization', 'Bearer other-token')
    expect(other.status).toBe(404)
  })

  it('mark-read zeroes own counter only', async () => {
    seedOrder('o1', 'owner')
    store.set('orders/o1', { ...store.get('orders/o1'), unread: { customer: 3, admin: 2 } })
    const res = await request(app)
      .post('/api/orders/o1/messages/read')
      .set('Authorization', 'Bearer owner-token')
    expect(res.status).toBe(200)
    const unread = (store.get('orders/o1') as { unread: { customer: number; admin: number } }).unread
    expect(unread.customer).toBe(0)
    expect(unread.admin).toBe(2)
  })
})

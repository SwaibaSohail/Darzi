import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer, type Server as HttpServer } from 'node:http'
import { io as clientIo, type Socket as ClientSocket } from 'socket.io-client'

vi.mock('../config/firebase.js', () => ({
  getAuthAdmin: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'customer-token') return { uid: 'u1', email: 'c@t.c' }
      if (token === 'admin-token') return { uid: 'adm', email: 's@t.c', admin: true }
      throw new Error('bad token')
    },
    getUser: async () => null,
  }),
  getDb: () => ({ collection: () => ({}) }),
  serverTimestamp: () => 'ts',
}))

const { initIo } = await import('./io.js')
const { emitOrderStatus } = await import('./emit.js')

let httpServer: HttpServer
let port: number

function connect(token?: string): ClientSocket {
  return clientIo(`http://localhost:${port}`, {
    auth: token ? { token } : {},
    transports: ['websocket'],
    reconnection: false,
  })
}

function waitConnect(socket: ClientSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.on('connect', () => resolve())
    socket.on('connect_error', (err) => reject(err))
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

describe('socket auth', () => {
  it('rejects connections without a token', async () => {
    const socket = connect()
    await expect(waitConnect(socket)).rejects.toThrow(/unauthorized/)
    socket.close()
  })

  it('rejects garbage tokens', async () => {
    const socket = connect('nonsense')
    await expect(waitConnect(socket)).rejects.toThrow(/unauthorized/)
    socket.close()
  })

  it('accepts valid tokens', async () => {
    const socket = connect('customer-token')
    await expect(waitConnect(socket)).resolves.toBeUndefined()
    socket.close()
  })
})

describe('order:status delivery', () => {
  it('reaches the order owner but not other customers', async () => {
    const owner = connect('customer-token')
    await waitConnect(owner)

    const received = new Promise<{ orderId: string; status: string }>((resolve) => {
      owner.on('order:status', resolve)
    })

    emitOrderStatus({
      id: 'o1',
      userId: 'u1',
      number: 'DRZ-2607-TEST',
      items: [],
      amounts: { subtotal: 0, delivery: 0, total: 0 },
      status: 'confirmed',
      timeline: [],
      address: { line1: '', city: '', postal: '', phone: '' },
      paymentMethod: 'cod',
      unread: { customer: 0, admin: 0 },
    })

    const payload = await received
    expect(payload.orderId).toBe('o1')
    expect(payload.status).toBe('confirmed')
    owner.close()
  })

  it('reaches admins for any order', async () => {
    const admin = connect('admin-token')
    await waitConnect(admin)

    const received = new Promise<{ orderId: string }>((resolve) => {
      admin.on('order:status', resolve)
    })

    emitOrderStatus({
      id: 'o2',
      userId: 'someone-else',
      number: 'DRZ-2607-TST2',
      items: [],
      amounts: { subtotal: 0, delivery: 0, total: 0 },
      status: 'cutting',
      timeline: [],
      address: { line1: '', city: '', postal: '', phone: '' },
      paymentMethod: 'cod',
      unread: { customer: 0, admin: 0 },
    })

    const payload = await received
    expect(payload.orderId).toBe('o2')
    admin.close()
  })
})

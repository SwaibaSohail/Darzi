import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const store = new Map<string, Record<string, unknown>>()
let autoId = 0

function makeRef(name: string, id?: string) {
  const docId = id ?? `gen${++autoId}`
  const key = `${name}/${docId}`
  return {
    id: docId,
    get: async () => ({ id: docId, exists: store.has(key), data: () => store.get(key) }),
    set: async (data: Record<string, unknown>) => void store.set(key, data),
    update: async (data: Record<string, unknown>) => {
      if (!store.has(key)) throw new Error('not found')
      store.set(key, { ...store.get(key), ...data })
    },
    delete: async () => void store.delete(key),
  }
}

const fakeDb = {
  collection: (name: string) => ({
    where: (_f: string, _op: string, userId: string) => ({
      get: async () => ({
        docs: [...store.entries()]
          .filter(([k, v]) => k.startsWith(`${name}/`) && v.userId === userId)
          .map(([k, v]) => ({ id: k.split('/')[1], data: () => v })),
      }),
    }),
    doc: (id?: string) => makeRef(name, id),
    orderBy: () => ({ get: async () => ({ docs: [] }) }),
  }),
  runTransaction: async <T>(cb: (tx: unknown) => Promise<T>): Promise<T> => {
    const tx = {
      get: (ref: { get: () => Promise<unknown> }) => ref.get(),
      set: (ref: { set: (d: Record<string, unknown>) => Promise<void> }, d: Record<string, unknown>) => void ref.set(d),
      update: (ref: { update: (d: Record<string, unknown>) => Promise<void> }, d: Record<string, unknown>) => void ref.update(d),
    }
    return cb(tx)
  },
}

vi.mock('../../config/firebase.js', () => ({
  getAuthAdmin: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'user-a') return { uid: 'ua', email: 'a@t.c' }
      if (token === 'user-b') return { uid: 'ub', email: 'b@t.c' }
      if (token === 'admin-token') return { uid: 'adm', email: 's@t.c', admin: true }
      throw new Error('bad')
    },
    getUser: async () => null,
  }),
  getDb: () => fakeDb,
  serverTimestamp: () => 'ts',
}))

const { default: app } = await import('../../app.js')

const address = { line1: 'Street 1', city: 'Lahore', postal: '54000', phone: '+923001234567' }

function seedProduct(id: string, over: Record<string, unknown> = {}) {
  store.set(`products/${id}`, {
    name: `Product ${id}`,
    description: 'd',
    category: 'ready-made',
    subcategory: 'kurta',
    price: 380000,
    sizes: ['M', 'L'],
    images: [],
    stock: 10,
    active: true,
    ...over,
  })
}

beforeEach(() => {
  store.clear()
})

describe('POST /api/orders', () => {
  it('creates an order with server-computed amounts and decrements stock', async () => {
    seedProduct('p1')
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [{ kind: 'product', productId: 'p1', qty: 2, size: 'M' }], address, paymentMethod: 'cod' })
    expect(res.status).toBe(201)
    expect(res.body.order.amounts).toEqual({ subtotal: 760000, delivery: 0, total: 760000 })
    expect(res.body.order.status).toBe('placed')
    expect(res.body.order.number).toMatch(/^DRZ-\d{4}-[A-Z0-9]{4}$/)
    expect((store.get('products/p1') as { stock: number }).stock).toBe(8)
  })

  it('charges delivery below the free threshold', async () => {
    seedProduct('p1', { price: 100000, sizes: [] })
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [{ kind: 'product', productId: 'p1', qty: 1 }], address, paymentMethod: 'cod' })
    expect(res.body.order.amounts).toEqual({ subtotal: 100000, delivery: 20000, total: 120000 })
  })

  it('rejects client-supplied prices (strict schema)', async () => {
    seedProduct('p1')
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [{ kind: 'product', productId: 'p1', qty: 1, size: 'M', unitPrice: 1 }],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })

  it('rejects orders exceeding stock and leaves stock untouched', async () => {
    seedProduct('p1', { stock: 1 })
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [{ kind: 'product', productId: 'p1', qty: 3, size: 'M' }], address, paymentMethod: 'cod' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('OUT_OF_STOCK')
    expect((store.get('products/p1') as { stock: number }).stock).toBe(1)
  })

  it('rejects inactive products', async () => {
    seedProduct('p1', { active: false })
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [{ kind: 'product', productId: 'p1', qty: 1, size: 'M' }], address, paymentMethod: 'cod' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('UNAVAILABLE')
  })

  it('requires auth', async () => {
    const res = await request(app).post('/api/orders').send({})
    expect(res.status).toBe(401)
  })
})

describe('order access', () => {
  async function placeOrder(token = 'user-a') {
    seedProduct('p1')
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ kind: 'product', productId: 'p1', qty: 1, size: 'M' }], address, paymentMethod: 'cod' })
    return res.body.order.id as string
  }

  it('owner can read their order', async () => {
    const id = await placeOrder()
    const res = await request(app).get(`/api/orders/${id}`).set('Authorization', 'Bearer user-a')
    expect(res.status).toBe(200)
  })

  it('other users get 404, not 403', async () => {
    const id = await placeOrder()
    const res = await request(app).get(`/api/orders/${id}`).set('Authorization', 'Bearer user-b')
    expect(res.status).toBe(404)
  })

  it('admin can read any order', async () => {
    const id = await placeOrder()
    const res = await request(app).get(`/api/orders/${id}`).set('Authorization', 'Bearer admin-token')
    expect(res.status).toBe(200)
  })

  it('my orders lists only own orders', async () => {
    await placeOrder('user-a')
    const res = await request(app).get('/api/me/orders').set('Authorization', 'Bearer user-b')
    expect(res.body.items).toHaveLength(0)
  })
})

describe('POST /api/orders/:id/cancel', () => {
  async function placeOrder() {
    seedProduct('p1', { stock: 5 })
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [{ kind: 'product', productId: 'p1', qty: 2, size: 'M' }], address, paymentMethod: 'cod' })
    return res.body.order.id as string
  }

  it('cancels a placed order and restores stock', async () => {
    const id = await placeOrder()
    expect((store.get('products/p1') as { stock: number }).stock).toBe(3)
    const res = await request(app)
      .post(`/api/orders/${id}/cancel`)
      .set('Authorization', 'Bearer user-a')
    expect(res.status).toBe(200)
    expect(res.body.order.status).toBe('cancelled')
    expect((store.get('products/p1') as { stock: number }).stock).toBe(5)
  })

  it('blocks cancel once work has started', async () => {
    const id = await placeOrder()
    store.set(`orders/${id}`, { ...store.get(`orders/${id}`), status: 'cutting' })
    const res = await request(app)
      .post(`/api/orders/${id}/cancel`)
      .set('Authorization', 'Bearer user-a')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_STATE')
  })

  it('foreign users cannot cancel (404)', async () => {
    const id = await placeOrder()
    const res = await request(app)
      .post(`/api/orders/${id}/cancel`)
      .set('Authorization', 'Bearer user-b')
    expect(res.status).toBe(404)
  })
})

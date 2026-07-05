import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const store = new Map<string, Record<string, unknown>>()

const fakeDb = {
  collection: (name: string) => ({
    get: async () => ({
      docs: [...store.entries()]
        .filter(([k]) => k.startsWith(`${name}/`))
        .map(([k, v]) => ({ id: k.split('/')[1], data: () => v })),
    }),
    where: () => ({ get: async () => ({ docs: [] }) }),
    orderBy: () => ({ get: async () => ({ docs: [] }) }),
    doc: (id: string) => ({
      id,
      get: async () => ({ id, exists: store.has(`${name}/${id}`), data: () => store.get(`${name}/${id}`) }),
      update: async (data: Record<string, unknown>) => {
        store.set(`${name}/${id}`, { ...store.get(`${name}/${id}`), ...data })
      },
    }),
  }),
}

vi.mock('../../config/firebase.js', () => ({
  getAuthAdmin: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'admin-token') return { uid: 'adm', email: 's@t.c', admin: true }
      if (token === 'customer-token') return { uid: 'u1', email: 'c@t.c' }
      throw new Error('bad')
    },
    getUser: async () => null,
  }),
  getDb: () => fakeDb,
  serverTimestamp: () => 'ts',
}))

const { default: app } = await import('../../app.js')

function seedOrder(id: string, status: string) {
  store.set(`orders/${id}`, {
    userId: 'u1',
    number: 'DRZ-2607-AAAA',
    items: [],
    amounts: { subtotal: 100, delivery: 0, total: 100 },
    status,
    timeline: [{ status: 'placed', at: 'ts', by: 'customer' }],
    address: {},
    paymentMethod: 'cod',
    unread: { customer: 0, admin: 0 },
  })
}

beforeEach(() => {
  store.clear()
})

describe('PATCH /api/admin/orders/:id/status', () => {
  it('403s customers', async () => {
    seedOrder('o1', 'placed')
    const res = await request(app)
      .patch('/api/admin/orders/o1/status')
      .set('Authorization', 'Bearer customer-token')
      .send({ status: 'confirmed' })
    expect(res.status).toBe(403)
  })

  it('advances along legal transitions and appends the timeline', async () => {
    seedOrder('o1', 'placed')
    const res = await request(app)
      .patch('/api/admin/orders/o1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'confirmed' })
    expect(res.status).toBe(200)
    expect(res.body.order.status).toBe('confirmed')
    expect(res.body.order.timeline).toHaveLength(2)
    expect((store.get('orders/o1') as { status: string }).status).toBe('confirmed')
  })

  it('rejects illegal jumps', async () => {
    seedOrder('o1', 'placed')
    const res = await request(app)
      .patch('/api/admin/orders/o1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'delivered' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_TRANSITION')
    expect((store.get('orders/o1') as { status: string }).status).toBe('placed')
  })

  it('rejects transitions out of terminal states', async () => {
    seedOrder('o1', 'delivered')
    const res = await request(app)
      .patch('/api/admin/orders/o1/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'placed' })
    expect(res.status).toBe(400)
  })

  it('404s missing orders', async () => {
    const res = await request(app)
      .patch('/api/admin/orders/nope/status')
      .set('Authorization', 'Bearer admin-token')
      .send({ status: 'confirmed' })
    expect(res.status).toBe(404)
  })
})

describe('GET /api/admin/orders', () => {
  it('lists all orders with optional status filter', async () => {
    seedOrder('o1', 'placed')
    seedOrder('o2', 'cutting')
    const all = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', 'Bearer admin-token')
    expect(all.body.items).toHaveLength(2)
    const filtered = await request(app)
      .get('/api/admin/orders?status=cutting')
      .set('Authorization', 'Bearer admin-token')
    expect(filtered.body.items).toHaveLength(1)
    expect(filtered.body.items[0].id).toBe('o2')
  })
})

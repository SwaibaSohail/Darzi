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
    doc: () => ({ get: async () => ({ exists: false }) }),
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

function seedOrder(id: string, status: string, total = 100000, adminUnread = 0) {
  store.set(`orders/${id}`, {
    userId: 'u1',
    status,
    amounts: { subtotal: total, delivery: 0, total },
    unread: { customer: 0, admin: adminUnread },
  })
}

beforeEach(() => {
  store.clear()
})

describe('GET /api/admin/stats', () => {
  it('403s customers', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer customer-token')
    expect(res.status).toBe(403)
  })

  it('aggregates counts, revenue, and unread chats', async () => {
    seedOrder('o1', 'placed')
    seedOrder('o2', 'stitching', 100000, 2)
    seedOrder('o3', 'delivered', 750000)
    seedOrder('o4', 'delivered', 250000)
    seedOrder('o5', 'cancelled')
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer admin-token')
    expect(res.status).toBe(200)
    expect(res.body.stats.totalOrders).toBe(5)
    expect(res.body.stats.active).toBe(2)
    expect(res.body.stats.byStatus.delivered).toBe(2)
    expect(res.body.stats.deliveredRevenue).toBe(1000000)
    expect(res.body.stats.unreadChats).toBe(1)
  })
})

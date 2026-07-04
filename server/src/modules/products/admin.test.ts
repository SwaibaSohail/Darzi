import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const store = new Map<string, Record<string, unknown>>()
let autoId = 0

const fakeDb = {
  collection: (name: string) => ({
    orderBy: () => ({
      get: async () => ({
        docs: [...store.entries()]
          .filter(([k]) => k.startsWith(`${name}/`))
          .map(([k, v]) => ({ id: k.split('/')[1], data: () => v })),
      }),
    }),
    doc: (id?: string) => {
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
      }
    },
  }),
}

const tokens: Record<string, { uid: string; email: string; admin?: boolean }> = {
  'admin-token': { uid: 'admin1', email: 'shop@test.com', admin: true },
  'customer-token': { uid: 'u1', email: 'c@test.com' },
}

vi.mock('../../config/firebase.js', () => ({
  getAuthAdmin: () => ({
    verifyIdToken: async (token: string) => {
      const claims = tokens[token]
      if (!claims) throw new Error('bad token')
      return claims
    },
    getUser: async () => null,
  }),
  getDb: () => fakeDb,
  serverTimestamp: () => 'ts',
}))

const { default: app } = await import('../../app.js')

const validProduct = {
  name: 'Test Kurta',
  description: 'A kurta for tests',
  category: 'ready-made',
  subcategory: 'kurta',
  price: 400000,
  sizes: ['M'],
  images: [],
  stock: 5,
}

beforeEach(() => {
  store.clear()
})

describe('admin products authz', () => {
  it('403s non-admin users', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', 'Bearer customer-token')
      .send(validProduct)
    expect(res.status).toBe(403)
  })

  it('401s missing tokens', async () => {
    const res = await request(app).get('/api/admin/products')
    expect(res.status).toBe(401)
  })
})

describe('admin products CRUD', () => {
  it('creates a product', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', 'Bearer admin-token')
      .send(validProduct)
    expect(res.status).toBe(201)
    expect(res.body.product.id).toBeTruthy()
    expect(res.body.product.name).toBe('Test Kurta')
  })

  it('rejects unknown fields (strict schema)', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', 'Bearer admin-token')
      .send({ ...validProduct, hacker: true })
    expect(res.status).toBe(400)
  })

  it('rejects non-integer prices', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', 'Bearer admin-token')
      .send({ ...validProduct, price: 49.99 })
    expect(res.status).toBe(400)
  })

  it('updates a product', async () => {
    store.set('products/p1', { ...validProduct, active: true })
    const res = await request(app)
      .patch('/api/admin/products/p1')
      .set('Authorization', 'Bearer admin-token')
      .send({ stock: 99 })
    expect(res.status).toBe(200)
    expect(res.body.product.stock).toBe(99)
  })

  it('404s updates to missing products', async () => {
    const res = await request(app)
      .patch('/api/admin/products/nope')
      .set('Authorization', 'Bearer admin-token')
      .send({ stock: 1 })
    expect(res.status).toBe(404)
  })

  it('soft-deletes by setting active false', async () => {
    store.set('products/p1', { ...validProduct, active: true })
    const res = await request(app)
      .delete('/api/admin/products/p1')
      .set('Authorization', 'Bearer admin-token')
    expect(res.status).toBe(200)
    expect((store.get('products/p1') as { active: boolean }).active).toBe(false)
  })

  it('lists all products including inactive for admin', async () => {
    store.set('products/p1', { ...validProduct, active: false })
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', 'Bearer admin-token')
    expect(res.status).toBe(200)
    expect(res.body.items).toHaveLength(1)
  })
})

describe('admin services CRUD', () => {
  it('creates a service with options', async () => {
    const res = await request(app)
      .post('/api/admin/services')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Test Stitching',
        description: 'desc',
        basePrice: 200000,
        options: [
          {
            key: 'collar',
            label: 'Collar',
            choices: [{ value: 'ban', label: 'Ban', priceDelta: 0 }],
          },
        ],
        measurementFields: ['chest'],
        image: null,
      })
    expect(res.status).toBe(201)
    expect(res.body.service.options).toHaveLength(1)
  })

  it('rejects negative price deltas', async () => {
    const res = await request(app)
      .post('/api/admin/services')
      .set('Authorization', 'Bearer admin-token')
      .send({
        name: 'Bad',
        description: 'desc',
        basePrice: 200000,
        options: [
          { key: 'x', label: 'X', choices: [{ value: 'v', label: 'V', priceDelta: -5 }] },
        ],
        measurementFields: [],
        image: null,
      })
    expect(res.status).toBe(400)
  })
})

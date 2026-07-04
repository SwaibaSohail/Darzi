import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

interface FakeDoc {
  id: string
  data: Record<string, unknown>
}

let productDocs: FakeDoc[] = []

const fakeDb = {
  collection: (name: string) => ({
    orderBy: () => ({
      get: async () => ({
        docs: (name === 'products' ? productDocs : []).map((d) => ({
          id: d.id,
          data: () => d.data,
        })),
      }),
    }),
    doc: (id: string) => ({
      get: async () => {
        const found = (name === 'products' ? productDocs : []).find((d) => d.id === id)
        return { id, exists: !!found, data: () => found?.data }
      },
    }),
  }),
}

vi.mock('../../config/firebase.js', () => ({
  getAuthAdmin: () => ({ verifyIdToken: async () => { throw new Error('no auth in this suite') }, getUser: async () => null }),
  getDb: () => fakeDb,
  serverTimestamp: () => 'ts',
}))

const { default: app } = await import('../../app.js')

function product(id: string, over: Partial<FakeDoc['data']> = {}): FakeDoc {
  return {
    id,
    data: {
      name: `Product ${id}`,
      description: 'desc',
      category: 'ready-made',
      subcategory: 'kameez',
      price: 450000,
      sizes: ['M', 'L'],
      images: [],
      stock: 5,
      active: true,
      ...over,
    },
  }
}

beforeEach(() => {
  productDocs = []
})

describe('GET /api/products', () => {
  it('lists only active products', async () => {
    productDocs = [product('a'), product('b', { active: false }), product('c')]
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    expect(res.body.items.map((p: { id: string }) => p.id)).toEqual(['a', 'c'])
  })

  it('filters by category', async () => {
    productDocs = [product('a'), product('b', { category: 'fabric', subcategory: 'cotton' })]
    const res = await request(app).get('/api/products?category=fabric')
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].id).toBe('b')
  })

  it('searches by name substring, case-insensitive', async () => {
    productDocs = [product('a', { name: 'Irish Linen Bundle' }), product('b', { name: 'Cotton' })]
    const res = await request(app).get('/api/products?search=linen')
    expect(res.body.items).toHaveLength(1)
    expect(res.body.items[0].id).toBe('a')
  })

  it('paginates with cursor', async () => {
    productDocs = [product('a'), product('b'), product('c')]
    const page1 = await request(app).get('/api/products?limit=2')
    expect(page1.body.items.map((p: { id: string }) => p.id)).toEqual(['a', 'b'])
    expect(page1.body.nextCursor).toBe('b')
    const page2 = await request(app).get(`/api/products?limit=2&cursor=${page1.body.nextCursor}`)
    expect(page2.body.items.map((p: { id: string }) => p.id)).toEqual(['c'])
    expect(page2.body.nextCursor).toBeNull()
  })

  it('rejects bad category values', async () => {
    const res = await request(app).get('/api/products?category=weird')
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })
})

describe('GET /api/products/:id', () => {
  it('returns a product', async () => {
    productDocs = [product('a')]
    const res = await request(app).get('/api/products/a')
    expect(res.status).toBe(200)
    expect(res.body.product.id).toBe('a')
  })

  it('404s for missing products', async () => {
    const res = await request(app).get('/api/products/nope')
    expect(res.status).toBe(404)
  })

  it('404s for inactive products (hidden, not leaked)', async () => {
    productDocs = [product('a', { active: false })]
    const res = await request(app).get('/api/products/a')
    expect(res.status).toBe(404)
  })
})

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
  }
}

const fakeDb = {
  collection: (name: string) => ({
    where: () => ({ get: async () => ({ docs: [] }) }),
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
      throw new Error('bad')
    },
    getUser: async () => null,
  }),
  getDb: () => fakeDb,
  serverTimestamp: () => 'ts',
}))

const { default: app } = await import('../../app.js')

const address = { line1: 'Street 1', city: 'Lahore', postal: '54000', phone: '+923001234567' }

function seedService(id: string, over: Record<string, unknown> = {}) {
  store.set(`services/${id}`, {
    name: 'Shalwar Kameez Stitching',
    description: 'd',
    basePrice: 250000,
    options: [
      {
        key: 'collar',
        label: 'Collar style',
        choices: [
          { value: 'ban', label: 'Ban collar', priceDelta: 0 },
          { value: 'round', label: 'Round neck', priceDelta: 5000 },
        ],
      },
    ],
    measurementFields: ['chest', 'waist'],
    image: null,
    active: true,
    ...over,
  })
}

function seedFabric(id: string, over: Record<string, unknown> = {}) {
  store.set(`products/${id}`, {
    name: 'Premium Cotton',
    description: 'd',
    category: 'fabric',
    subcategory: 'cotton',
    price: 350000,
    sizes: [],
    images: [],
    stock: 5,
    active: true,
    ...over,
  })
}

function customLine(over: Record<string, unknown> = {}) {
  return {
    kind: 'custom',
    serviceId: 's1',
    optionSelections: [{ key: 'collar', value: 'round' }],
    fabric: { source: 'shop', productId: 'f1' },
    measurements: { unit: 'cm', values: { chest: 102, waist: 86 } },
    styleNotes: 'Slим fit please',
    ...over,
  }
}

beforeEach(() => {
  store.clear()
  seedService('s1')
  seedFabric('f1')
})

describe('custom order lines', () => {
  it('prices base + option delta + shop fabric, decrements fabric stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [customLine()], address, paymentMethod: 'cod' })
    expect(res.status).toBe(201)
    const item = res.body.order.items[0]
    expect(item.lineTotal).toBe(250000 + 5000 + 350000)
    expect(res.body.order.amounts.subtotal).toBe(605000)
    expect(res.body.order.amounts.delivery).toBe(0)
    expect((store.get('products/f1') as { stock: number }).stock).toBe(4)
  })

  it('own fabric skips fabric price and stock', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [customLine({ fabric: { source: 'own' } })], address, paymentMethod: 'cod' })
    expect(res.status).toBe(201)
    expect(res.body.order.items[0].lineTotal).toBe(255000)
    expect((store.get('products/f1') as { stock: number }).stock).toBe(5)
  })

  it('rejects unknown option selections', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ optionSelections: [{ key: 'collar', value: 'hacked' }] })],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(400)
  })

  it('rejects missing required measurements', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ measurements: { unit: 'cm', values: { chest: 102 } } })],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/waist/)
  })

  it('rejects out-of-range inline measurements', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ measurements: { unit: 'cm', values: { chest: 999, waist: 86 } } })],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(400)
  })

  it('uses a saved profile snapshot (owned)', async () => {
    store.set('measurementProfiles/mp1', {
      userId: 'ua',
      label: 'Mine',
      unit: 'cm',
      values: { chest: 100, waist: 84 },
      notes: '',
    })
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ measurements: undefined, measurementProfileId: 'mp1' })],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(201)
    expect(res.body.order.items[0].measurements.values).toEqual({ chest: 100, waist: 84 })
  })

  it('rejects another user\'s measurement profile', async () => {
    store.set('measurementProfiles/mp1', {
      userId: 'ub',
      label: 'Not yours',
      unit: 'cm',
      values: { chest: 100, waist: 84 },
      notes: '',
    })
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ measurements: undefined, measurementProfileId: 'mp1' })],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(400)
  })

  it('rejects both or neither measurement source', async () => {
    const both = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ measurementProfileId: 'mp1' })],
        address,
        paymentMethod: 'cod',
      })
    expect(both.status).toBe(400)
    const neither = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ measurements: undefined })],
        address,
        paymentMethod: 'cod',
      })
    expect(neither.status).toBe(400)
  })

  it('rejects reference images from other users\' folders', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ referenceImagePath: 'darzi/references/ub/stolen.jpg' })],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(400)
  })

  it('accepts own reference images', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({
        items: [customLine({ referenceImagePath: 'darzi/references/ua/sketch.jpg' })],
        address,
        paymentMethod: 'cod',
      })
    expect(res.status).toBe(201)
    expect(res.body.order.items[0].referenceImage.path).toBe('darzi/references/ua/sketch.jpg')
  })

  it('cancel restores fabric stock', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [customLine()], address, paymentMethod: 'cod' })
    expect((store.get('products/f1') as { stock: number }).stock).toBe(4)
    const res = await request(app)
      .post(`/api/orders/${created.body.order.id}/cancel`)
      .set('Authorization', 'Bearer user-a')
    expect(res.status).toBe(200)
    expect((store.get('products/f1') as { stock: number }).stock).toBe(5)
  })

  it('rejects out-of-stock fabric', async () => {
    seedFabric('f1', { stock: 0 })
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer user-a')
      .send({ items: [customLine()], address, paymentMethod: 'cod' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('OUT_OF_STOCK')
  })
})

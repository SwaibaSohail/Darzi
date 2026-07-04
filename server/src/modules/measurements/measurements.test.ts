import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

const store = new Map<string, Record<string, unknown>>()
let autoId = 0

const fakeDb = {
  collection: (name: string) => ({
    where: (_f: string, _op: string, userId: string) => ({
      get: async () => ({
        docs: [...store.entries()]
          .filter(([k, v]) => k.startsWith(`${name}/`) && v.userId === userId)
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
          store.set(key, { ...store.get(key), ...data })
        },
        delete: async () => void store.delete(key),
      }
    },
  }),
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

const validProfile = {
  label: 'My kameez fit',
  unit: 'cm',
  values: { chest: 102, waist: 86, sleeve: 61 },
  notes: '',
}

beforeEach(() => {
  store.clear()
})

describe('measurement profiles', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/me/measurements')
    expect(res.status).toBe(401)
  })

  it('creates and lists own profiles', async () => {
    const created = await request(app)
      .post('/api/me/measurements')
      .set('Authorization', 'Bearer user-a')
      .send(validProfile)
    expect(created.status).toBe(201)
    const list = await request(app)
      .get('/api/me/measurements')
      .set('Authorization', 'Bearer user-a')
    expect(list.body.items).toHaveLength(1)
    expect(list.body.items[0].label).toBe('My kameez fit')
  })

  it('never returns other users profiles', async () => {
    store.set('measurementProfiles/p1', { userId: 'ua', ...validProfile })
    const res = await request(app)
      .get('/api/me/measurements')
      .set('Authorization', 'Bearer user-b')
    expect(res.body.items).toHaveLength(0)
  })

  it('404s updates to foreign profiles', async () => {
    store.set('measurementProfiles/p1', { userId: 'ua', ...validProfile })
    const res = await request(app)
      .patch('/api/me/measurements/p1')
      .set('Authorization', 'Bearer user-b')
      .send(validProfile)
    expect(res.status).toBe(404)
    expect((store.get('measurementProfiles/p1') as { userId: string }).userId).toBe('ua')
  })

  it('404s deletes of foreign profiles', async () => {
    store.set('measurementProfiles/p1', { userId: 'ua', ...validProfile })
    const res = await request(app)
      .delete('/api/me/measurements/p1')
      .set('Authorization', 'Bearer user-b')
    expect(res.status).toBe(404)
    expect(store.has('measurementProfiles/p1')).toBe(true)
  })

  it('deletes own profiles', async () => {
    store.set('measurementProfiles/p1', { userId: 'ua', ...validProfile })
    const res = await request(app)
      .delete('/api/me/measurements/p1')
      .set('Authorization', 'Bearer user-a')
    expect(res.status).toBe(200)
    expect(store.has('measurementProfiles/p1')).toBe(false)
  })

  it('rejects out-of-range values for cm', async () => {
    const res = await request(app)
      .post('/api/me/measurements')
      .set('Authorization', 'Bearer user-a')
      .send({ ...validProfile, values: { chest: 400 } })
    expect(res.status).toBe(400)
  })

  it('rejects unknown measurement keys', async () => {
    const res = await request(app)
      .post('/api/me/measurements')
      .set('Authorization', 'Bearer user-a')
      .send({ ...validProfile, values: { wingspan: 100 } })
    expect(res.status).toBe(400)
  })

  it('rejects empty values', async () => {
    const res = await request(app)
      .post('/api/me/measurements')
      .set('Authorization', 'Bearer user-a')
      .send({ ...validProfile, values: {} })
    expect(res.status).toBe(400)
  })

  it('enforces the 10-profile cap', async () => {
    for (let i = 0; i < 10; i++) {
      store.set(`measurementProfiles/p${i}`, { userId: 'ua', ...validProfile })
    }
    const res = await request(app)
      .post('/api/me/measurements')
      .set('Authorization', 'Bearer user-a')
      .send(validProfile)
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('LIMIT')
  })
})

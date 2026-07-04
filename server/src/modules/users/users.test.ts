import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// In-memory fake Firestore: users collection keyed by uid
const store = new Map<string, Record<string, unknown>>()

const fakeDb = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      get: async () => {
        const key = `${name}/${id}`
        return {
          exists: store.has(key),
          data: () => store.get(key),
        }
      },
      set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
        const key = `${name}/${id}`
        if (opts?.merge && store.has(key)) {
          store.set(key, { ...store.get(key), ...data })
        } else {
          store.set(key, data)
        }
      },
      update: async (data: Record<string, unknown>) => {
        const key = `${name}/${id}`
        if (!store.has(key)) throw new Error('not found')
        store.set(key, { ...store.get(key), ...data })
      },
    }),
  }),
}

const tokens: Record<string, { uid: string; email: string; admin?: boolean }> = {
  'customer-token': { uid: 'u1', email: 'ali@test.com' },
  'admin-token': { uid: 'admin1', email: 'shop@test.com', admin: true },
}

vi.mock('../../config/firebase.js', () => ({
  getAuthAdmin: () => ({
    verifyIdToken: async (token: string) => {
      const claims = tokens[token]
      if (!claims) throw new Error('invalid token')
      return claims
    },
    getUser: async (uid: string) => ({
      uid,
      displayName: uid === 'u1' ? 'Ali Khan' : undefined,
    }),
  }),
  getDb: () => fakeDb,
  serverTimestamp: () => 'ts',
}))

const { default: app } = await import('../../app.js')

beforeEach(() => {
  store.clear()
})

describe('auth middleware', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/me')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHENTICATED')
  })

  it('rejects garbage tokens', async () => {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer nonsense')
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHENTICATED')
  })
})

describe('GET /api/me', () => {
  it('bootstraps a user doc on first call with customer role', async () => {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer customer-token')
    expect(res.status).toBe(200)
    expect(res.body.profile).toMatchObject({
      email: 'ali@test.com',
      name: 'Ali Khan',
      role: 'customer',
    })
    expect(res.body.isAdmin).toBe(false)
    expect(store.has('users/u1')).toBe(true)
  })

  it('returns the existing doc without recreating it', async () => {
    store.set('users/u1', { email: 'ali@test.com', name: 'Custom Name', role: 'customer' })
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer customer-token')
    expect(res.status).toBe(200)
    expect(res.body.profile.name).toBe('Custom Name')
  })

  it('reports isAdmin true only from the token claim', async () => {
    const res = await request(app).get('/api/me').set('Authorization', 'Bearer admin-token')
    expect(res.status).toBe(200)
    expect(res.body.isAdmin).toBe(true)
  })
})

describe('PATCH /api/me', () => {
  beforeEach(async () => {
    await request(app).get('/api/me').set('Authorization', 'Bearer customer-token')
  })

  it('updates allowed fields', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', 'Bearer customer-token')
      .send({ name: 'Ali K.', phone: '+923001234567' })
    expect(res.status).toBe(200)
    expect(res.body.profile.name).toBe('Ali K.')
    expect(res.body.profile.phone).toBe('+923001234567')
  })

  it('rejects attempts to set role (strict schema)', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', 'Bearer customer-token')
      .send({ role: 'admin' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
    expect((store.get('users/u1') as { role: string }).role).toBe('customer')
  })

  it('rejects invalid phone numbers', async () => {
    const res = await request(app)
      .patch('/api/me')
      .set('Authorization', 'Bearer customer-token')
      .send({ phone: 'not-a-phone' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION')
  })
})

describe('requireAdmin middleware', () => {
  it('returns 403 for non-admin users on admin routes', async () => {
    const { requireAdmin } = await import('../../middleware/auth.js')
    const req = { user: { uid: 'u1', email: 'a@b.c', isAdmin: false } } as never
    const status = vi.fn().mockReturnThis()
    const json = vi.fn()
    const next = vi.fn()
    requireAdmin(req, { status, json } as never, next)
    expect(status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })

  it('passes admin users through', async () => {
    const { requireAdmin } = await import('../../middleware/auth.js')
    const req = { user: { uid: 'admin1', email: 's@t.c', isAdmin: true } } as never
    const next = vi.fn()
    requireAdmin(req, {} as never, next)
    expect(next).toHaveBeenCalled()
  })
})

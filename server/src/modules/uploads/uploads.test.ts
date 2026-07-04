import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'

const uploadStreamMock = vi.fn()

vi.mock('../../config/firebase.js', () => ({
  getAuthAdmin: () => ({
    verifyIdToken: async (token: string) => {
      if (token === 'admin-token') return { uid: 'admin1', email: 'a@t.c', admin: true }
      if (token === 'customer-token') return { uid: 'u1', email: 'c@t.c' }
      throw new Error('bad token')
    },
    getUser: async () => null,
  }),
  getDb: () => ({ collection: () => ({}) }),
  serverTimestamp: () => 'ts',
}))

vi.mock('../../config/cloudinary.js', () => ({
  getCloudinary: () => ({
    uploader: {
      upload_stream: (
        _opts: unknown,
        cb: (err: unknown, res?: { secure_url: string; public_id: string }) => void,
      ) => {
        uploadStreamMock()
        return {
          end: () => cb(null, { secure_url: 'https://cdn.test/img.jpg', public_id: 'darzi/products/img' }),
        }
      },
    },
  }),
}))

const { default: app } = await import('../../app.js')

// Minimal real magic bytes
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)])
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64)])

describe('POST /api/admin/uploads/product', () => {
  it('403s non-admin users', async () => {
    const res = await request(app)
      .post('/api/admin/uploads/product')
      .set('Authorization', 'Bearer customer-token')
      .attach('image', JPEG, 'photo.jpg')
    expect(res.status).toBe(403)
  })

  it('rejects non-image content even with an image filename', async () => {
    const res = await request(app)
      .post('/api/admin/uploads/product')
      .set('Authorization', 'Bearer admin-token')
      .attach('image', EXE, 'innocent.jpg')
    expect(res.status).toBe(400)
    expect(uploadStreamMock).not.toHaveBeenCalled()
  })

  it('rejects requests with no file', async () => {
    const res = await request(app)
      .post('/api/admin/uploads/product')
      .set('Authorization', 'Bearer admin-token')
    expect(res.status).toBe(400)
  })

  it('uploads a real jpeg and returns url + path', async () => {
    const res = await request(app)
      .post('/api/admin/uploads/product')
      .set('Authorization', 'Bearer admin-token')
      .attach('image', JPEG, 'photo.jpg')
    expect(res.status).toBe(201)
    expect(res.body.image.url).toContain('https://')
    expect(res.body.image.path).toContain('darzi/products')
  })

  it('rejects oversized files via multer limit', async () => {
    const big = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(6 * 1024 * 1024)])
    const res = await request(app)
      .post('/api/admin/uploads/product')
      .set('Authorization', 'Bearer admin-token')
      .attach('image', big, 'huge.jpg')
    expect(res.status).toBe(400)
    expect(res.body.error.message).toMatch(/5 MB/)
  })
})

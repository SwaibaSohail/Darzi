import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from './app.js'

describe('GET /health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })
})

describe('unknown routes', () => {
  it('returns 404 with error.code NOT_FOUND', async () => {
    const res = await request(app).get('/nope')
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })
})

describe('security headers', () => {
  it('/health response has x-content-type-options: nosniff (helmet active)', async () => {
    const res = await request(app).get('/health')
    expect(res.headers['x-content-type-options']).toBe('nosniff')
  })
})

describe('CORS', () => {
  it('echoes allowed origin in access-control-allow-origin', async () => {
    const res = await request(app)
      .get('/health')
      .set('Origin', 'http://localhost:5173')
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})

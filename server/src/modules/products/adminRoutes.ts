import { Router } from 'express'
import type { ZodType } from 'zod'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import {
  createProductSchema,
  updateProductSchema,
  createServiceSchema,
  updateServiceSchema,
} from './adminSchemas.js'
import {
  listAllProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
  listAllServices,
  createService,
  updateService,
  softDeleteService,
} from './adminService.js'

function parseOr400<T>(schema: ZodType<T>, body: unknown, res: import('express').Response): T | null {
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    res.status(400).json({
      error: { code: 'VALIDATION', message: 'Invalid input', details: parsed.error.flatten() },
    })
    return null
  }
  return parsed.data
}

export const adminProductsRouter = Router()
adminProductsRouter.use(requireAuth, requireAdmin)

adminProductsRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ items: await listAllProducts() })
  } catch (err) {
    next(err)
  }
})

adminProductsRouter.post('/', async (req, res, next) => {
  try {
    const input = parseOr400(createProductSchema, req.body, res)
    if (!input) return
    res.status(201).json({ product: await createProduct(input) })
  } catch (err) {
    next(err)
  }
})

adminProductsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = parseOr400(updateProductSchema, req.body, res)
    if (!input) return
    const product = await updateProduct(req.params.id, input)
    if (!product) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } })
      return
    }
    res.json({ product })
  } catch (err) {
    next(err)
  }
})

adminProductsRouter.delete('/:id', async (req, res, next) => {
  try {
    const ok = await softDeleteProduct(req.params.id)
    if (!ok) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } })
      return
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export const adminServicesRouter = Router()
adminServicesRouter.use(requireAuth, requireAdmin)

adminServicesRouter.get('/', async (_req, res, next) => {
  try {
    res.json({ items: await listAllServices() })
  } catch (err) {
    next(err)
  }
})

adminServicesRouter.post('/', async (req, res, next) => {
  try {
    const input = parseOr400(createServiceSchema, req.body, res)
    if (!input) return
    res.status(201).json({ service: await createService(input) })
  } catch (err) {
    next(err)
  }
})

adminServicesRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = parseOr400(updateServiceSchema, req.body, res)
    if (!input) return
    const service = await updateService(req.params.id, input)
    if (!service) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Service not found' } })
      return
    }
    res.json({ service })
  } catch (err) {
    next(err)
  }
})

adminServicesRouter.delete('/:id', async (req, res, next) => {
  try {
    const ok = await softDeleteService(req.params.id)
    if (!ok) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Service not found' } })
      return
    }
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

import { Router } from 'express'
import { z } from 'zod'
import { listProducts, getProduct } from './service.js'

const listQuerySchema = z.object({
  category: z.enum(['ready-made', 'fabric']).optional(),
  subcategory: z.string().trim().max(40).optional(),
  search: z.string().trim().max(60).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().trim().max(60).optional(),
})

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: 'Invalid query', details: parsed.error.flatten() },
      })
      return
    }
    res.json(await listProducts(parsed.data))
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const product = await getProduct(req.params.id)
    if (!product) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Product not found' } })
      return
    }
    res.json({ product })
  } catch (err) {
    next(err)
  }
})

export default router

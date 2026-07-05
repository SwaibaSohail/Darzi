import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../../middleware/auth.js'
import { createOrderSchema } from './schemas.js'
import { createOrder, listMyOrders, getOrderFor, cancelOrder } from './service.js'

// Order creation is the abuse-sensitive endpoint — tighter than the general limit.
const createOrderLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

export const ordersRouter = Router()
ordersRouter.use(requireAuth)

ordersRouter.post('/', createOrderLimit, async (req, res, next) => {
  try {
    const parsed = createOrderSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: { code: 'VALIDATION', message: 'Invalid input', details: parsed.error.flatten() },
      })
      return
    }
    const order = await createOrder(req.user!.uid, parsed.data)
    res.status(201).json({ order })
  } catch (err) {
    next(err)
  }
})

ordersRouter.get('/:id', async (req, res, next) => {
  try {
    const order = await getOrderFor(req.user!.uid, req.user!.isAdmin, req.params.id)
    if (!order) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } })
      return
    }
    res.json({ order })
  } catch (err) {
    next(err)
  }
})

ordersRouter.post('/:id/cancel', async (req, res, next) => {
  try {
    const order = await cancelOrder(req.user!.uid, req.params.id)
    if (!order) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } })
      return
    }
    res.json({ order })
  } catch (err) {
    next(err)
  }
})

export const myOrdersRouter = Router()
myOrdersRouter.use(requireAuth)

myOrdersRouter.get('/', async (req, res, next) => {
  try {
    res.json({ items: await listMyOrders(req.user!.uid) })
  } catch (err) {
    next(err)
  }
})

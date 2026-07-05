import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { getDb, serverTimestamp } from '../../config/firebase.js'
import { canTransition } from './transitions.js'
import { ORDER_STATUSES, type Order, type OrderStatus } from './types.js'
import { emitOrderStatus } from '../../sockets/emit.js'

const statusBodySchema = z.object({ status: z.enum(ORDER_STATUSES) }).strict()
const listQuerySchema = z.object({ status: z.enum(ORDER_STATUSES).optional() }).strict()

const router = Router()
router.use(requireAuth, requireAdmin)

router.get('/', async (req, res, next) => {
  try {
    const parsed = listQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid query' } })
      return
    }
    const snap = await getDb().collection('orders').get()
    let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
    if (parsed.data.status) items = items.filter((o) => o.status === parsed.data.status)
    items.sort((a, b) => {
      const at = (a as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
      const bt = (b as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
      return bt - at
    })
    res.json({ items })
  } catch (err) {
    next(err)
  }
})

router.patch('/:id/status', async (req, res, next) => {
  try {
    const parsed = statusBodySchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION', message: 'Invalid status' } })
      return
    }
    const ref = getDb().collection('orders').doc(req.params.id)
    const snap = await ref.get()
    if (!snap.exists) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Order not found' } })
      return
    }
    const order = { id: snap.id, ...snap.data() } as Order
    const next_ = parsed.data.status as OrderStatus
    if (!canTransition(order.status, next_)) {
      res.status(400).json({
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot move an order from "${order.status}" to "${next_}"`,
        },
      })
      return
    }
    const timeline = [...order.timeline, { status: next_, at: new Date(), by: 'admin' as const }]
    await ref.update({ status: next_, timeline, updatedAt: serverTimestamp() })
    const updated: Order = { ...order, status: next_, timeline }
    emitOrderStatus(updated)
    res.json({ order: updated })
  } catch (err) {
    next(err)
  }
})

export default router

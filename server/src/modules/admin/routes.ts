import { Router } from 'express'
import { requireAuth, requireAdmin } from '../../middleware/auth.js'
import { getDb } from '../../config/firebase.js'
import type { Order, OrderStatus } from '../orders/types.js'
import { ORDER_STATUSES } from '../orders/types.js'

const router = Router()
router.use(requireAuth, requireAdmin)

router.get('/stats', async (_req, res, next) => {
  try {
    const snap = await getDb().collection('orders').get()
    const orders = snap.docs.map((d) => d.data() as Order)

    const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<
      OrderStatus,
      number
    >
    let deliveredRevenue = 0
    let unreadChats = 0
    for (const order of orders) {
      byStatus[order.status] += 1
      if (order.status === 'delivered') deliveredRevenue += order.amounts.total
      if ((order.unread?.admin ?? 0) > 0) unreadChats += 1
    }

    const active =
      byStatus.placed + byStatus.confirmed + byStatus.cutting + byStatus.stitching + byStatus.ready

    res.json({
      stats: {
        totalOrders: orders.length,
        active,
        byStatus,
        deliveredRevenue,
        unreadChats,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router

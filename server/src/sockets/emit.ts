import { ioOrNull } from './io.js'
import type { Order } from '../modules/orders/types.js'

/** Pushes a status change to the order's owner, anyone in the order room, and admins. */
export function emitOrderStatus(order: Order): void {
  const io = ioOrNull()
  if (!io) return
  const payload = {
    orderId: order.id,
    status: order.status,
    timeline: order.timeline,
  }
  io.to(`user:${order.userId}`).to(`order:${order.id}`).to('admin').emit('order:status', payload)
}

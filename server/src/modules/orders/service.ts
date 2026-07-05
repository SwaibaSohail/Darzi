import { getDb, serverTimestamp } from '../../config/firebase.js'
import { AppError } from '../../lib/errors.js'
import type { Product } from '../products/types.js'
import { buildProductLine, computeAmounts } from './pricing.js'
import { customerCanCancel } from './transitions.js'
import type { CreateOrderInput } from './schemas.js'
import type { Order, OrderItem } from './types.js'

function generateOrderNumber(): string {
  const now = new Date()
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DRZ-${yymm}-${rand}`
}

/**
 * Creates an order inside a Firestore transaction: reads every referenced
 * product, validates availability, decrements stock, and writes the order
 * with server-computed amounts. Two racing checkouts cannot oversell.
 */
export async function createOrder(userId: string, input: CreateOrderInput): Promise<Order> {
  const db = getDb()
  const orderRef = db.collection('orders').doc()

  const order = await db.runTransaction(async (tx) => {
    const items: OrderItem[] = []
    const stockUpdates: { ref: FirebaseFirestore.DocumentReference; newStock: number }[] = []

    for (const line of input.items) {
      const ref = db.collection('products').doc(line.productId)
      const snap = await tx.get(ref)
      const product = snap.exists ? ({ id: snap.id, ...snap.data() } as Product) : null
      const item = buildProductLine(line, product)
      items.push(item)
      stockUpdates.push({ ref, newStock: product!.stock - line.qty })
    }

    const amounts = computeAmounts(items)
    const doc: Omit<Order, 'id'> = {
      userId,
      number: generateOrderNumber(),
      items,
      amounts,
      status: 'placed',
      timeline: [{ status: 'placed', at: new Date(), by: 'customer' }],
      address: input.address,
      paymentMethod: 'cod',
      unread: { customer: 0, admin: 0 },
    }

    for (const u of stockUpdates) {
      tx.update(u.ref, { stock: u.newStock })
    }
    tx.set(orderRef, { ...doc, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    return { id: orderRef.id, ...doc }
  })

  return order
}

export async function listMyOrders(userId: string): Promise<Order[]> {
  const snap = await getDb().collection('orders').where('userId', '==', userId).get()
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order)
  // newest first; sorted in memory to avoid a composite index at this scale
  return orders.sort((a, b) => {
    const at = (a as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
    const bt = (b as { createdAt?: { toMillis?: () => number } }).createdAt?.toMillis?.() ?? 0
    return bt - at
  })
}

/** Owner or admin; anyone else sees 404 (never confirm existence). */
export async function getOrderFor(
  userId: string,
  isAdmin: boolean,
  orderId: string,
): Promise<Order | null> {
  const snap = await getDb().collection('orders').doc(orderId).get()
  if (!snap.exists) return null
  const order = { id: snap.id, ...snap.data() } as Order
  if (order.userId !== userId && !isAdmin) return null
  return order
}

/** Customer cancel: only from placed/confirmed; restores ready-made stock. */
export async function cancelOrder(userId: string, orderId: string): Promise<Order | null> {
  const db = getDb()
  const ref = db.collection('orders').doc(orderId)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) return null
    const order = { id: snap.id, ...snap.data() } as Order
    if (order.userId !== userId) return null
    if (!customerCanCancel(order.status)) {
      throw new AppError(400, 'INVALID_STATE', 'This order can no longer be cancelled')
    }

    for (const item of order.items) {
      if (item.kind === 'product') {
        const productRef = db.collection('products').doc(item.productId)
        const productSnap = await tx.get(productRef)
        if (productSnap.exists) {
          const current = (productSnap.data() as Product).stock
          tx.update(productRef, { stock: current + item.qty })
        }
      }
    }

    const timeline = [...order.timeline, { status: 'cancelled' as const, at: new Date(), by: 'customer' as const }]
    tx.update(ref, { status: 'cancelled', timeline, updatedAt: serverTimestamp() })
    return { ...order, status: 'cancelled' as const, timeline }
  })
}

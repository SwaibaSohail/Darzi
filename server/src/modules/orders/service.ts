import { getDb, serverTimestamp } from '../../config/firebase.js'
import { env } from '../../config/env.js'
import { AppError } from '../../lib/errors.js'
import type { Product, StitchingService } from '../products/types.js'
import { validateMeasurementValues } from '../measurements/schemas.js'
import { buildProductLine, buildCustomLine, computeAmounts, type ResolvedMeasurements } from './pricing.js'
import { customerCanCancel } from './transitions.js'
import type { CreateOrderInput, CustomLineInput } from './schemas.js'
import type { Order, OrderItem } from './types.js'

function generateOrderNumber(): string {
  const now = new Date()
  const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `DRZ-${yymm}-${rand}`
}

function referenceImageFromPath(userId: string, path: string | undefined) {
  if (!path) return null
  // Uploads are namespaced per user — attaching someone else's file is rejected.
  if (!path.startsWith(`darzi/references/${userId}/`)) {
    throw new AppError(400, 'VALIDATION', 'Invalid reference image')
  }
  return {
    url: `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${path}`,
    path,
  }
}

async function resolveMeasurements(
  tx: FirebaseFirestore.Transaction,
  userId: string,
  line: CustomLineInput,
): Promise<ResolvedMeasurements> {
  const hasInline = !!line.measurements
  const hasProfile = !!line.measurementProfileId
  if (hasInline === hasProfile) {
    throw new AppError(400, 'VALIDATION', 'Provide measurements inline or a saved profile, not both')
  }
  if (hasProfile) {
    const ref = getDb().collection('measurementProfiles').doc(line.measurementProfileId!)
    const snap = await tx.get(ref)
    const data = snap.exists ? (snap.data() as { userId: string; unit: 'cm' | 'in'; values: Record<string, number> }) : null
    if (!data || data.userId !== userId) {
      throw new AppError(400, 'VALIDATION', 'Measurement profile not found')
    }
    return { unit: data.unit, values: data.values }
  }
  const inline = line.measurements!
  const problem = validateMeasurementValues(inline.unit, inline.values as Record<string, number>)
  if (problem) throw new AppError(400, 'VALIDATION', problem)
  return { unit: inline.unit, values: inline.values as Record<string, number> }
}

/**
 * Creates an order inside a Firestore transaction: reads every referenced
 * product/service, validates availability, decrements stock (ready-made qty,
 * one bundle per shop-fabric custom line), and writes the order with
 * server-computed amounts. Two racing checkouts cannot oversell.
 */
export async function createOrder(userId: string, input: CreateOrderInput): Promise<Order> {
  const db = getDb()
  const orderRef = db.collection('orders').doc()

  const order = await db.runTransaction(async (tx) => {
    const items: OrderItem[] = []
    const stockUpdates: { ref: FirebaseFirestore.DocumentReference; newStock: number }[] = []

    for (const line of input.items) {
      if (line.kind === 'product') {
        const ref = db.collection('products').doc(line.productId)
        const snap = await tx.get(ref)
        const product = snap.exists ? ({ id: snap.id, ...snap.data() } as Product) : null
        const item = buildProductLine(line, product)
        items.push(item)
        stockUpdates.push({ ref, newStock: product!.stock - line.qty })
        continue
      }

      // custom stitching line
      const serviceRef = db.collection('services').doc(line.serviceId)
      const serviceSnap = await tx.get(serviceRef)
      const service = serviceSnap.exists
        ? ({ id: serviceSnap.id, ...serviceSnap.data() } as StitchingService)
        : null

      let fabricProduct: Product | null = null
      let fabricRef: FirebaseFirestore.DocumentReference | null = null
      if (line.fabric.source === 'shop') {
        fabricRef = db.collection('products').doc(line.fabric.productId)
        const fabricSnap = await tx.get(fabricRef)
        fabricProduct = fabricSnap.exists
          ? ({ id: fabricSnap.id, ...fabricSnap.data() } as Product)
          : null
      }

      const measurements = await resolveMeasurements(tx, userId, line)
      const referenceImage = referenceImageFromPath(userId, line.referenceImagePath)
      const item = buildCustomLine(line, service, fabricProduct, measurements, referenceImage)
      items.push(item)
      if (fabricRef && fabricProduct) {
        stockUpdates.push({ ref: fabricRef, newStock: fabricProduct.stock - 1 })
      }
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

    // Firestore transactions demand every read before any write — gather all
    // restock reads first, then apply the updates.
    const restocks: { ref: FirebaseFirestore.DocumentReference; newStock: number }[] = []
    for (const item of order.items) {
      let productId: string | null = null
      let restockQty = 0
      if (item.kind === 'product') {
        productId = item.productId
        restockQty = item.qty
      } else if (item.fabric.source === 'shop') {
        productId = item.fabric.productId
        restockQty = 1
      }
      if (!productId) continue
      const productRef = db.collection('products').doc(productId)
      const productSnap = await tx.get(productRef)
      if (productSnap.exists) {
        restocks.push({
          ref: productRef,
          newStock: (productSnap.data() as Product).stock + restockQty,
        })
      }
    }
    for (const r of restocks) {
      tx.update(r.ref, { stock: r.newStock })
    }

    const timeline = [...order.timeline, { status: 'cancelled' as const, at: new Date(), by: 'customer' as const }]
    tx.update(ref, { status: 'cancelled', timeline, updatedAt: serverTimestamp() })
    return { ...order, status: 'cancelled' as const, timeline }
  })
}

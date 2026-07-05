import { AppError } from '../../lib/errors.js'
import type { Product } from '../products/types.js'
import type { OrderItem, OrderAmounts, ReadyMadeItem } from './types.js'

export const DELIVERY_FEE = 20_000 // Rs 200
export const FREE_DELIVERY_THRESHOLD = 500_000 // Rs 5,000

export interface ProductLineRequest {
  kind: 'product'
  productId: string
  qty: number
  size?: string
}

/**
 * Builds a priced order line from an untrusted request against the catalog
 * record. All prices come from the DB — the client never supplies one.
 */
export function buildProductLine(req: ProductLineRequest, product: Product | null): ReadyMadeItem {
  if (!product || !product.active) {
    throw new AppError(400, 'UNAVAILABLE', 'One of the items is no longer available')
  }
  if (product.stock < req.qty) {
    throw new AppError(400, 'OUT_OF_STOCK', `"${product.name}" has only ${product.stock} left`)
  }
  if (product.sizes.length > 0) {
    if (!req.size || !product.sizes.includes(req.size)) {
      throw new AppError(400, 'VALIDATION', `Pick a valid size for "${product.name}"`)
    }
  }
  return {
    kind: 'product',
    productId: product.id,
    name: product.name,
    unitPrice: product.price,
    qty: req.qty,
    size: product.sizes.length > 0 ? req.size! : null,
    image: product.images[0]?.url ?? null,
  }
}

export function computeAmounts(items: OrderItem[]): OrderAmounts {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  return { subtotal, delivery, total: subtotal + delivery }
}

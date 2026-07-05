import { AppError } from '../../lib/errors.js'
import type { Product, StitchingService } from '../products/types.js'
import type { OrderItem, OrderAmounts, ReadyMadeItem, CustomItem } from './types.js'
import type { CustomLineInput } from './schemas.js'

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

export interface ResolvedMeasurements {
  unit: 'cm' | 'in'
  values: Record<string, number>
}

/**
 * Builds a priced custom-stitching line. Base price, option deltas, and shop
 * fabric price all come from catalog records; the measurement snapshot is
 * embedded so later profile edits never mutate placed orders.
 */
export function buildCustomLine(
  req: CustomLineInput,
  service: StitchingService | null,
  fabricProduct: Product | null,
  measurements: ResolvedMeasurements,
  referenceImage: { url: string; path: string } | null,
): CustomItem {
  if (!service || !service.active) {
    throw new AppError(400, 'UNAVAILABLE', 'This stitching service is no longer available')
  }

  const optionSelections: CustomItem['optionSelections'] = []
  for (const sel of req.optionSelections) {
    const option = service.options.find((o) => o.key === sel.key)
    const choice = option?.choices.find((c) => c.value === sel.value)
    if (!option || !choice) {
      throw new AppError(400, 'VALIDATION', `Unknown option selection "${sel.key}: ${sel.value}"`)
    }
    optionSelections.push({
      key: option.key,
      label: option.label,
      value: choice.value,
      choiceLabel: choice.label,
      priceDelta: choice.priceDelta,
    })
  }

  let fabric: CustomItem['fabric']
  let fabricPrice = 0
  if (req.fabric.source === 'shop') {
    if (
      !fabricProduct ||
      !fabricProduct.active ||
      fabricProduct.category !== 'fabric'
    ) {
      throw new AppError(400, 'UNAVAILABLE', 'The selected fabric is not available')
    }
    if (fabricProduct.stock < 1) {
      throw new AppError(400, 'OUT_OF_STOCK', `"${fabricProduct.name}" is out of stock`)
    }
    fabric = {
      source: 'shop',
      productId: fabricProduct.id,
      name: fabricProduct.name,
      price: fabricProduct.price,
    }
    fabricPrice = fabricProduct.price
  } else {
    fabric = { source: 'own' }
  }

  const missing = service.measurementFields.filter((f) => measurements.values[f] === undefined)
  if (missing.length > 0) {
    throw new AppError(400, 'VALIDATION', `Missing measurements: ${missing.join(', ')}`)
  }

  const deltas = optionSelections.reduce((sum, s) => sum + s.priceDelta, 0)

  return {
    kind: 'custom',
    serviceId: service.id,
    serviceName: service.name,
    basePrice: service.basePrice,
    optionSelections,
    fabric,
    measurements,
    styleNotes: req.styleNotes,
    referenceImage,
    lineTotal: service.basePrice + deltas + fabricPrice,
  }
}

export function lineTotal(item: OrderItem): number {
  return item.kind === 'product' ? item.unitPrice * item.qty : item.lineTotal
}

export function computeAmounts(items: OrderItem[]): OrderAmounts {
  const subtotal = items.reduce((sum, item) => sum + lineTotal(item), 0)
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  return { subtotal, delivery, total: subtotal + delivery }
}

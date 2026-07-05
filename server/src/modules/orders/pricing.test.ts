import { describe, it, expect } from 'vitest'
import { buildProductLine, computeAmounts, DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from './pricing.js'
import { ALLOWED_TRANSITIONS, canTransition, customerCanCancel } from './transitions.js'
import type { Product } from '../products/types.js'
import type { OrderItem } from './types.js'
import { AppError } from '../../lib/errors.js'

function product(over: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Kurta',
    description: 'd',
    category: 'ready-made',
    subcategory: 'kurta',
    price: 380000,
    sizes: ['M', 'L'],
    images: [],
    stock: 10,
    active: true,
    ...over,
  }
}

function line(qty: number, unitPrice: number): OrderItem {
  return { kind: 'product', productId: 'p', name: 'x', unitPrice, qty, size: null, image: null }
}

describe('buildProductLine', () => {
  it('prices from the catalog record, never the request', () => {
    const item = buildProductLine({ kind: 'product', productId: 'p1', qty: 2, size: 'M' }, product())
    expect(item.unitPrice).toBe(380000)
    expect(item.qty).toBe(2)
    expect(item.size).toBe('M')
  })

  it('rejects missing products', () => {
    expect(() => buildProductLine({ kind: 'product', productId: 'x', qty: 1 }, null)).toThrow(AppError)
  })

  it('rejects inactive products', () => {
    expect(() =>
      buildProductLine({ kind: 'product', productId: 'p1', qty: 1, size: 'M' }, product({ active: false })),
    ).toThrow(/no longer available/)
  })

  it('rejects insufficient stock', () => {
    expect(() =>
      buildProductLine({ kind: 'product', productId: 'p1', qty: 5, size: 'M' }, product({ stock: 3 })),
    ).toThrow(/only 3 left/)
  })

  it('requires a valid size when the product has sizes', () => {
    expect(() =>
      buildProductLine({ kind: 'product', productId: 'p1', qty: 1 }, product()),
    ).toThrow(/valid size/)
    expect(() =>
      buildProductLine({ kind: 'product', productId: 'p1', qty: 1, size: 'XXL' }, product()),
    ).toThrow(/valid size/)
  })

  it('ignores size for fabric (no sizes)', () => {
    const item = buildProductLine(
      { kind: 'product', productId: 'p1', qty: 1 },
      product({ sizes: [], category: 'fabric' }),
    )
    expect(item.size).toBeNull()
  })
})

describe('computeAmounts', () => {
  it('sums line totals', () => {
    const amounts = computeAmounts([line(2, 100000), line(1, 50000)])
    expect(amounts.subtotal).toBe(250000)
  })

  it('charges delivery below the threshold', () => {
    const amounts = computeAmounts([line(1, FREE_DELIVERY_THRESHOLD - 1)])
    expect(amounts.delivery).toBe(DELIVERY_FEE)
    expect(amounts.total).toBe(FREE_DELIVERY_THRESHOLD - 1 + DELIVERY_FEE)
  })

  it('free delivery at and above the threshold', () => {
    expect(computeAmounts([line(1, FREE_DELIVERY_THRESHOLD)]).delivery).toBe(0)
    expect(computeAmounts([line(2, FREE_DELIVERY_THRESHOLD)]).delivery).toBe(0)
  })
})

describe('order state machine', () => {
  it('encodes the full pipeline', () => {
    expect(canTransition('placed', 'confirmed')).toBe(true)
    expect(canTransition('confirmed', 'cutting')).toBe(true)
    expect(canTransition('cutting', 'stitching')).toBe(true)
    expect(canTransition('stitching', 'ready')).toBe(true)
    expect(canTransition('ready', 'delivered')).toBe(true)
  })

  it('blocks skips and reversals', () => {
    expect(canTransition('placed', 'delivered')).toBe(false)
    expect(canTransition('placed', 'stitching')).toBe(false)
    expect(canTransition('delivered', 'placed')).toBe(false)
    expect(canTransition('ready', 'cutting')).toBe(false)
  })

  it('terminal states go nowhere', () => {
    expect(ALLOWED_TRANSITIONS.delivered).toHaveLength(0)
    expect(ALLOWED_TRANSITIONS.cancelled).toHaveLength(0)
  })

  it('cancel is only allowed before work starts', () => {
    expect(customerCanCancel('placed')).toBe(true)
    expect(customerCanCancel('confirmed')).toBe(true)
    expect(customerCanCancel('cutting')).toBe(false)
    expect(customerCanCancel('stitching')).toBe(false)
    expect(customerCanCancel('ready')).toBe(false)
    expect(customerCanCancel('delivered')).toBe(false)
    expect(customerCanCancel('cancelled')).toBe(false)
  })
})

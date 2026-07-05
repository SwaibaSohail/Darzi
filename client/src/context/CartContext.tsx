import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CustomRequestLine } from '../features/custom/api'

export interface ProductCartItem {
  kind: 'product'
  productId: string
  name: string
  unitPrice: number // paisa, display only — server reprices at checkout
  qty: number
  size: string | null
  image: string | null
}

export interface CustomCartItem {
  kind: 'custom'
  lineId: string
  serviceName: string
  summary: string // e.g. "Shop fabric: Premium Cotton · Ban collar"
  estimate: number // paisa, display only
  image: string | null
  request: CustomRequestLine // sent verbatim to POST /api/orders
}

export type CartItem = ProductCartItem | CustomCartItem

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: Omit<ProductCartItem, 'qty' | 'kind'>, qty?: number) => void
  addCustomItem: (item: Omit<CustomCartItem, 'lineId' | 'kind'>) => void
  removeProduct: (productId: string, size: string | null) => void
  removeCustom: (lineId: string) => void
  setQty: (productId: string, size: string | null, qty: number) => void
  clear: () => void
}

const STORAGE_KEY = 'darzi-cart-v2'
const MAX_QTY = 10

const CartContext = createContext<CartContextValue | null>(null)

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((i): i is CartItem => {
      if (i?.kind === 'product') {
        return typeof i.productId === 'string' && typeof i.qty === 'number' && i.qty > 0
      }
      if (i?.kind === 'custom') {
        return typeof i.lineId === 'string' && typeof i.request === 'object'
      }
      return false
    })
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(item: Omit<ProductCartItem, 'qty' | 'kind'>, qty = 1) {
    setItems((prev) => {
      const existing = prev.find(
        (i): i is ProductCartItem =>
          i.kind === 'product' && i.productId === item.productId && i.size === item.size,
      )
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...existing, qty: Math.min(existing.qty + qty, MAX_QTY) } : i,
        )
      }
      return [...prev, { kind: 'product', ...item, qty: Math.min(qty, MAX_QTY) }]
    })
  }

  function addCustomItem(item: Omit<CustomCartItem, 'lineId' | 'kind'>) {
    setItems((prev) => [
      ...prev,
      { kind: 'custom', lineId: crypto.randomUUID(), ...item },
    ])
  }

  function removeProduct(productId: string, size: string | null) {
    setItems((prev) =>
      prev.filter((i) => !(i.kind === 'product' && i.productId === productId && i.size === size)),
    )
  }

  function removeCustom(lineId: string) {
    setItems((prev) => prev.filter((i) => !(i.kind === 'custom' && i.lineId === lineId)))
  }

  function setQty(productId: string, size: string | null, qty: number) {
    if (qty < 1) return removeProduct(productId, size)
    setItems((prev) =>
      prev.map((i) =>
        i.kind === 'product' && i.productId === productId && i.size === size
          ? { ...i, qty: Math.min(qty, MAX_QTY) }
          : i,
      ),
    )
  }

  const clear = () => setItems([])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + (i.kind === 'product' ? i.qty : 1), 0)
    const subtotal = items.reduce(
      (n, i) => n + (i.kind === 'product' ? i.unitPrice * i.qty : i.estimate),
      0,
    )
    return { items, count, subtotal, addItem, addCustomItem, removeProduct, removeCustom, setQty, clear }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}

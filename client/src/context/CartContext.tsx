import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export interface CartItem {
  productId: string
  name: string
  unitPrice: number // paisa, display only — server reprices at checkout
  qty: number
  size: string | null
  image: string | null
}

interface CartContextValue {
  items: CartItem[]
  count: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  removeItem: (productId: string, size: string | null) => void
  setQty: (productId: string, size: string | null, qty: number) => void
  clear: () => void
}

const STORAGE_KEY = 'darzi-cart-v1'
const MAX_QTY = 10

const CartContext = createContext<CartContextValue | null>(null)

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (i): i is CartItem =>
        typeof i?.productId === 'string' &&
        typeof i?.qty === 'number' &&
        i.qty > 0 &&
        typeof i?.unitPrice === 'number',
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(item: Omit<CartItem, 'qty'>, qty = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId && i.size === item.size)
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, qty: Math.min(i.qty + qty, MAX_QTY) } : i,
        )
      }
      return [...prev, { ...item, qty: Math.min(qty, MAX_QTY) }]
    })
  }

  function removeItem(productId: string, size: string | null) {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)))
  }

  function setQty(productId: string, size: string | null, qty: number) {
    if (qty < 1) return removeItem(productId, size)
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.size === size ? { ...i, qty: Math.min(qty, MAX_QTY) } : i,
      ),
    )
  }

  const clear = () => setItems([])

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0)
    const subtotal = items.reduce((n, i) => n + i.unitPrice * i.qty, 0)
    return { items, count, subtotal, addItem, removeItem, setQty, clear }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}

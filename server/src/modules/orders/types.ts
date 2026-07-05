export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'cutting',
  'stitching',
  'ready',
  'delivered',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface ReadyMadeItem {
  kind: 'product'
  productId: string
  name: string
  unitPrice: number // paisa, snapshot at order time
  qty: number
  size: string | null
  image: string | null
}

export interface CustomItem {
  kind: 'custom'
  serviceId: string
  serviceName: string
  basePrice: number
  optionSelections: { key: string; label: string; value: string; choiceLabel: string; priceDelta: number }[]
  fabric:
    | { source: 'shop'; productId: string; name: string; price: number }
    | { source: 'own' }
  measurements: { unit: 'cm' | 'in'; values: Record<string, number> } // snapshot, never a reference
  styleNotes: string
  referenceImage: { url: string; path: string } | null
  lineTotal: number
}

export type OrderItem = ReadyMadeItem | CustomItem

export interface OrderAmounts {
  subtotal: number
  delivery: number
  total: number
}

export interface TimelineEntry {
  status: OrderStatus
  at: unknown // Firestore Timestamp
  by: 'customer' | 'admin' | 'system'
}

export interface Order {
  id: string
  userId: string
  number: string
  items: OrderItem[]
  amounts: OrderAmounts
  status: OrderStatus
  timeline: TimelineEntry[]
  address: { line1: string; city: string; postal: string; phone: string }
  paymentMethod: 'cod'
  unread: { customer: number; admin: number }
}

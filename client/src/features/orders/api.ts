import { apiFetch } from '../../lib/api'

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'cutting',
  'stitching',
  'ready',
  'delivered',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number] | 'cancelled'

import type { CustomRequestLine } from '../custom/api'

export interface ProductOrderItem {
  kind: 'product'
  productId: string
  name: string
  unitPrice: number
  qty: number
  size: string | null
  image: string | null
}

export interface CustomOrderItem {
  kind: 'custom'
  serviceId: string
  serviceName: string
  basePrice: number
  optionSelections: { key: string; label: string; value: string; choiceLabel: string; priceDelta: number }[]
  fabric: { source: 'shop'; productId: string; name: string; price: number } | { source: 'own' }
  measurements: { unit: 'cm' | 'in'; values: Record<string, number> }
  styleNotes: string
  referenceImage: { url: string; path: string } | null
  lineTotal: number
}

export type OrderItem = ProductOrderItem | CustomOrderItem

export interface Order {
  id: string
  number: string
  items: OrderItem[]
  amounts: { subtotal: number; delivery: number; total: number }
  status: OrderStatus
  timeline: { status: OrderStatus; at: { _seconds?: number } | string; by: string }[]
  address: { line1: string; city: string; postal: string; phone: string }
  paymentMethod: 'cod'
  createdAt?: { _seconds?: number }
}

export interface CreateOrderRequest {
  items: ({ kind: 'product'; productId: string; qty: number; size?: string } | CustomRequestLine)[]
  address: { line1: string; city: string; postal: string; phone: string }
  paymentMethod: 'cod'
}

export const ordersApi = {
  create: (input: CreateOrderRequest) =>
    apiFetch<{ order: Order }>('/api/orders', { method: 'POST', body: input }),
  listMine: () => apiFetch<{ items: Order[] }>('/api/me/orders'),
  get: (id: string) => apiFetch<{ order: Order }>(`/api/orders/${id}`),
  cancel: (id: string) => apiFetch<{ order: Order }>(`/api/orders/${id}/cancel`, { method: 'POST' }),
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  cutting: 'Cutting',
  stitching: 'Stitching',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  placed: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-sky-100 text-sky-800',
  cutting: 'bg-amber-100 text-amber-800',
  stitching: 'bg-violet-100 text-violet-800',
  ready: 'bg-emerald-100 text-emerald-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-700',
}

import type { OrderStatus } from './types.js'

/** Single source of truth for the order state machine. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['confirmed', 'cancelled'],
  confirmed: ['cutting', 'cancelled'],
  cutting: ['stitching'],
  stitching: ['ready'],
  ready: ['delivered'],
  delivered: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

/** Customers may only cancel, and only before work starts. */
export function customerCanCancel(status: OrderStatus): boolean {
  return status === 'placed' || status === 'confirmed'
}

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { CartProvider, useCart, type CartItem } from './CartContext'
import type { ReactNode } from 'react'

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>

const kurta: Omit<CartItem, 'qty'> = {
  productId: 'p1',
  name: 'Kurta',
  unitPrice: 380000,
  size: 'M',
  image: null,
}

beforeEach(() => {
  localStorage.clear()
})

describe('CartContext', () => {
  it('adds items and computes count and subtotal', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(kurta, 2))
    expect(result.current.count).toBe(2)
    expect(result.current.subtotal).toBe(760000)
  })

  it('merges same product+size instead of duplicating', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(kurta))
    act(() => result.current.addItem(kurta))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].qty).toBe(2)
  })

  it('treats different sizes as separate lines', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(kurta))
    act(() => result.current.addItem({ ...kurta, size: 'L' }))
    expect(result.current.items).toHaveLength(2)
  })

  it('caps quantity at 10', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(kurta, 8))
    act(() => result.current.addItem(kurta, 8))
    expect(result.current.items[0].qty).toBe(10)
  })

  it('setQty(0) removes the line', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(kurta))
    act(() => result.current.setQty('p1', 'M', 0))
    expect(result.current.items).toHaveLength(0)
  })

  it('persists to localStorage and rehydrates', () => {
    const first = renderHook(() => useCart(), { wrapper })
    act(() => first.result.current.addItem(kurta, 3))
    first.unmount()

    const second = renderHook(() => useCart(), { wrapper })
    expect(second.result.current.count).toBe(3)
    expect(second.result.current.items[0].name).toBe('Kurta')
  })

  it('ignores corrupted localStorage', () => {
    localStorage.setItem('darzi-cart-v1', '{broken json')
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toHaveLength(0)
  })

  it('clear empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.addItem(kurta))
    act(() => result.current.clear())
    expect(result.current.count).toBe(0)
  })
})

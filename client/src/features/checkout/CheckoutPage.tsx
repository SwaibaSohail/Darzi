import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { ordersApi } from '../orders/api'
import { formatPKR } from '../../lib/money'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [line1, setLine1] = useState(profile?.address?.line1 ?? '')
  const [city, setCity] = useState(profile?.address?.city ?? '')
  const [postal, setPostal] = useState(profile?.address?.postal ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [error, setError] = useState('')

  const placeOrder = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: ({ order }) => {
      clear()
      navigate(`/orders/${order.id}`, { replace: true })
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Could not place the order'),
  })

  if (items.length === 0 && !placeOrder.isPending) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-2xl text-primary mb-2">Nothing to check out</p>
        <Link to="/products" className="text-accent hover:underline">
          Browse the collection
        </Link>
      </div>
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!line1.trim() || !city.trim() || !postal.trim()) {
      setError('Complete the delivery address.')
      return
    }
    if (!/^\+?[0-9]{7,15}$/.test(phone.replace(/[\s-]/g, ''))) {
      setError('Enter a valid phone number, e.g. +923001234567.')
      return
    }
    placeOrder.mutate({
      items: items.map((i) => ({
        kind: 'product' as const,
        productId: i.productId,
        qty: i.qty,
        ...(i.size ? { size: i.size } : {}),
      })),
      address: {
        line1: line1.trim(),
        city: city.trim(),
        postal: postal.trim(),
        phone: phone.replace(/[\s-]/g, ''),
      },
      paymentMethod: 'cod',
    })
  }

  return (
    <div className="max-w-xl">
      <h2 className="font-display text-4xl font-semibold text-primary mb-10">Checkout</h2>

      {error && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <fieldset className="mb-8">
          <legend className="font-medium text-primary mb-4">Delivery address</legend>
          <TextField
            label="Address line"
            id="co-line1"
            autoComplete="street-address"
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="City"
              id="co-city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <TextField
              label="Postal code"
              id="co-postal"
              autoComplete="postal-code"
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
            />
          </div>
          <TextField
            label="Phone"
            id="co-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+923001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </fieldset>

        <fieldset className="mb-8">
          <legend className="font-medium text-primary mb-3">Payment</legend>
          <label className="flex items-center gap-3 border border-accent rounded-lg px-4 py-3 bg-surface cursor-pointer">
            <input type="radio" name="payment" value="cod" checked readOnly className="accent-accent" />
            <div>
              <p className="text-sm font-medium text-primary">Cash on delivery</p>
              <p className="text-xs text-secondary">Pay when your order arrives.</p>
            </div>
          </label>
        </fieldset>

        <div className="flex items-center justify-between border-t border-border pt-5 mb-8">
          <span className="text-secondary">Order total (confirmed on placement)</span>
          <span className="font-semibold text-primary text-lg tabular-nums">
            ~{formatPKR(subtotal)}
          </span>
        </div>

        <Button type="submit" loading={placeOrder.isPending}>
          Place order
        </Button>
      </form>
    </div>
  )
}

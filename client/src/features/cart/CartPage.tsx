import { Link, useNavigate } from 'react-router'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { formatPKR } from '../../lib/money'
import { Button } from '../../components/Button'

const FREE_DELIVERY_THRESHOLD = 500_000
const DELIVERY_FEE = 20_000

export function CartPage() {
  const { items, subtotal, removeItem, setQty } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-2xl text-primary mb-2">Your cart is empty</p>
        <Link to="/products" className="text-accent hover:underline">
          Browse the collection
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-display text-4xl font-semibold text-primary mb-10">Your cart</h2>

      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}`} className="py-5 flex gap-4">
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  width={64}
                  height={80}
                  className="w-16 h-20 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-20 bg-muted rounded" aria-hidden="true" />
              )}
              <div className="flex-1">
                <div className="flex justify-between gap-4">
                  <div>
                    <Link
                      to={`/products/${item.productId}`}
                      className="font-medium text-primary hover:text-accent"
                    >
                      {item.name}
                    </Link>
                    {item.size && <p className="text-sm text-secondary">Size {item.size}</p>}
                  </div>
                  <p className="font-semibold text-primary tabular-nums">
                    {formatPKR(item.unitPrice * item.qty)}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center border border-border rounded">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${item.name}`}
                      onClick={() => setQty(item.productId, item.size, item.qty - 1)}
                      className="px-3 py-1 text-secondary hover:text-primary cursor-pointer"
                    >
                      −
                    </button>
                    <span className="px-3 tabular-nums text-sm" aria-live="polite">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${item.name}`}
                      onClick={() => setQty(item.productId, item.size, item.qty + 1)}
                      className="px-3 py-1 text-secondary hover:text-primary cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.size)}
                    className="text-sm text-secondary hover:text-destructive cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="border border-border rounded-lg p-6 bg-surface h-fit">
          <h3 className="font-medium text-primary mb-4">Summary</h3>
          <dl className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <dt className="text-secondary">Subtotal</dt>
              <dd className="tabular-nums">{formatPKR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-secondary">Delivery</dt>
              <dd className="tabular-nums">{delivery === 0 ? 'Free' : formatPKR(delivery)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold text-primary">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPKR(subtotal + delivery)}</dd>
            </div>
          </dl>
          <p className="text-xs text-secondary mb-5">
            Final amount is confirmed at checkout. Cash on delivery.
          </p>
          <Button
            type="button"
            onClick={() => navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } })}
          >
            Checkout
          </Button>
        </aside>
      </div>
    </div>
  )
}

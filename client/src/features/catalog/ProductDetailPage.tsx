import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { fetchProduct } from './api'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'
import { Button } from '../../components/Button'
import { useCart } from '../../context/CartContext'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [size, setSize] = useState<string | null>(null)
  const [sizeError, setSizeError] = useState('')
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const { data, isPending, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  })

  if (isPending) {
    return (
      <div className="grid md:grid-cols-2 gap-10">
        <Skeleton className="aspect-[4/5]" />
        <div>
          <Skeleton className="h-8 w-2/3 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-6" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-2xl text-primary mb-2">Product not found</p>
        <Link to="/products" className="text-accent hover:underline">
          Back to collection
        </Link>
      </div>
    )
  }

  const { product } = data
  const needsSize = product.sizes.length > 0

  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div className="aspect-[4/5] bg-muted rounded-lg overflow-hidden">
        {product.images[0] && (
          <img
            src={product.images[0].url}
            alt={product.name}
            width={800}
            height={1000}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-secondary mb-2">
          {product.category === 'fabric' ? 'Fabric' : 'Ready-made'} · {product.subcategory}
        </p>
        <h2 className="font-display text-4xl font-semibold text-primary mb-3">{product.name}</h2>
        <p className="text-2xl text-primary font-semibold tabular-nums mb-6">
          {formatPKR(product.price)}
        </p>
        <p className="text-secondary mb-8 leading-relaxed">{product.description}</p>

        {needsSize && (
          <fieldset className="mb-8">
            <legend className="text-sm font-medium text-primary mb-2">Size</legend>
            {sizeError && (
              <p className="text-sm text-destructive mb-2" role="alert">
                {sizeError}
              </p>
            )}
            <div className="flex gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s)
                    setSizeError('')
                  }}
                  aria-pressed={size === s}
                  className={`w-12 h-12 rounded border text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    size === s
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-border text-primary hover:border-accent'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {product.stock === 0 ? (
          <p className="text-destructive font-medium mb-4">Out of stock</p>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              type="button"
              onClick={() => {
                if (needsSize && !size) {
                  setSizeError('Pick a size first.')
                  return
                }
                addItem({
                  productId: product.id,
                  name: product.name,
                  unitPrice: product.price,
                  size: needsSize ? size : null,
                  image: product.images[0]?.url ?? null,
                })
                setAdded(true)
                setTimeout(() => setAdded(false), 2500)
              }}
            >
              Add to cart
            </Button>
            {added && (
              <span className="text-sm text-green-700" role="status">
                Added ✓{' '}
                <Link to="/cart" className="text-accent hover:underline">
                  View cart
                </Link>
              </span>
            )}
          </div>
        )}

        <p className="mt-6 text-sm text-secondary">
          Want it stitched to your measurements instead?{' '}
          <Link to="/custom" className="text-accent hover:underline">
            Custom stitching
          </Link>
        </p>
      </div>
    </div>
  )
}

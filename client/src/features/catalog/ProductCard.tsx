import { Link } from 'react-router'
import { formatPKR } from '../../lib/money'
import type { Product } from './api'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="aspect-[4/5] bg-muted overflow-hidden">
        {product.images[0] && (
          <img
            src={product.images[0].url}
            alt={product.name}
            loading="lazy"
            width={400}
            height={500}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="p-4">
        <p className="text-xs uppercase tracking-wide text-secondary mb-1">
          {product.category === 'fabric' ? 'Fabric' : 'Ready-made'} · {product.subcategory}
        </p>
        <h3 className="font-medium text-primary mb-2 group-hover:text-accent transition-colors duration-150">
          {product.name}
        </h3>
        <p className="text-primary font-semibold tabular-nums">{formatPKR(product.price)}</p>
      </div>
    </Link>
  )
}

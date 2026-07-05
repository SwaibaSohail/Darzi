import { useDeferredValue, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { fetchProducts, type CatalogFilters } from './api'
import { ProductCard } from './ProductCard'
import { Skeleton } from '../../components/Skeleton'

const CATEGORIES = [
  { value: undefined, label: 'All' },
  { value: 'ready-made', label: 'Ready-made' },
  { value: 'fabric', label: 'Fabric' },
] as const

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = (searchParams.get('category') ?? undefined) as CatalogFilters['category']
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['products', { category, search: deferredSearch }],
    queryFn: () => fetchProducts({ category, search: deferredSearch || undefined }),
  })

  function setCategory(value?: string) {
    if (value) setSearchParams({ category: value })
    else setSearchParams({})
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-accent mb-3">The wardrobe</p>
      <h2 className="font-display text-5xl font-semibold text-primary mb-10">Collection</h2>

      <div className="flex flex-wrap items-center gap-4 mb-10">
        <div role="tablist" aria-label="Filter by category" className="flex gap-2">
          {CATEGORIES.map((c) => {
            const active = category === c.value
            return (
              <button
                key={c.label}
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c.value)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? 'bg-primary text-white'
                    : 'bg-surface border border-border text-secondary hover:border-accent'
                }`}
              >
                {c.label}
              </button>
            )
          })}
        </div>
        <div className="flex-1 min-w-48 max-w-xs">
          <label htmlFor="catalog-search" className="sr-only">
            Search products
          </label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 bg-surface border border-border rounded-full text-sm text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      {isPending && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/5] mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-20">
          <p className="text-secondary mb-4">Could not load the collection.</p>
          <button
            onClick={() => refetch()}
            className="text-accent hover:underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-20">
          <p className="font-display text-2xl text-primary mb-2">Nothing here yet</p>
          <p className="text-secondary">Try a different category or search term.</p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../catalog/api'
import type { FabricChoice } from './CustomOrderWizard'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'
import { Button } from '../../components/Button'
import { useState } from 'react'

interface StepFabricProps {
  selected: FabricChoice | null
  onBack: () => void
  onNext: (choice: FabricChoice) => void
}

export function StepFabric({ selected, onBack, onNext }: StepFabricProps) {
  const [choice, setChoice] = useState<FabricChoice | null>(selected)

  const { data, isPending } = useQuery({
    queryKey: ['products', { category: 'fabric', search: '' }],
    queryFn: () => fetchProducts({ category: 'fabric' }),
  })

  return (
    <div>
      <button
        type="button"
        role="radio"
        aria-checked={choice?.source === 'own'}
        onClick={() => setChoice({ source: 'own' })}
        className={`w-full text-left border rounded-lg p-5 bg-surface mb-6 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          choice?.source === 'own' ? 'border-accent ring-1 ring-accent' : 'border-border'
        }`}
      >
        <h3 className="font-medium text-primary mb-1">I'll provide my own fabric</h3>
        <p className="text-sm text-secondary">
          Drop your fabric at the shop after placing the order — stitching cost only.
        </p>
      </button>

      <h3 className="font-medium text-primary mb-4">Or pick a shop fabric</h3>

      {isPending && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8" role="radiogroup" aria-label="Shop fabric">
          {data.items
            .filter((p) => p.stock > 0)
            .map((fabricProduct) => {
              const active =
                choice?.source === 'shop' && choice.product.id === fabricProduct.id
              return (
                <button
                  key={fabricProduct.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setChoice({ source: 'shop', product: fabricProduct })}
                  className={`text-left border rounded-lg overflow-hidden bg-surface transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active ? 'border-accent ring-1 ring-accent' : 'border-border'
                  }`}
                >
                  {fabricProduct.images[0] && (
                    <img
                      src={fabricProduct.images[0].url}
                      alt={fabricProduct.name}
                      loading="lazy"
                      width={300}
                      height={200}
                      className="w-full h-28 object-cover"
                    />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-primary mb-1">{fabricProduct.name}</p>
                    <p className="text-sm text-primary tabular-nums">
                      {formatPKR(fabricProduct.price)}
                    </p>
                  </div>
                </button>
              )
            })}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" disabled={!choice} onClick={() => choice && onNext(choice)}>
          Continue
        </Button>
      </div>
    </div>
  )
}

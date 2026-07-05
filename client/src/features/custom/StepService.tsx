import { useQuery } from '@tanstack/react-query'
import { customApi, type StitchingService } from './api'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'

interface StepServiceProps {
  selected: StitchingService | null
  onSelect: (service: StitchingService) => void
}

export function StepService({ selected, onSelect }: StepServiceProps) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['services'],
    queryFn: customApi.listServices,
  })

  if (isPending) {
    return (
      <div className="grid sm:grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary mb-3">Could not load services.</p>
        <button onClick={() => refetch()} className="text-accent hover:underline cursor-pointer">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Stitching service">
      {data.items.map((service) => (
        <button
          key={service.id}
          type="button"
          role="radio"
          aria-checked={selected?.id === service.id}
          onClick={() => onSelect(service)}
          className={`text-left border rounded-lg p-5 bg-surface transition-all duration-150 cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            selected?.id === service.id ? 'border-accent ring-1 ring-accent' : 'border-border'
          }`}
        >
          <h3 className="font-display text-xl text-primary mb-1">{service.name}</h3>
          <p className="text-sm text-secondary mb-3 line-clamp-2">{service.description}</p>
          <p className="text-primary font-semibold tabular-nums">
            from {formatPKR(service.basePrice)}
            <span className="text-secondary font-normal text-sm"> + fabric</span>
          </p>
        </button>
      ))}
    </div>
  )
}

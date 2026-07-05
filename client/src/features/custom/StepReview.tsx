import { MEASUREMENT_FIELDS } from '../measurements/api'
import type { StitchingService } from './api'
import type { FabricChoice } from './CustomOrderWizard'
import type { MeasurementDraft } from './StepMeasurements'
import { formatPKR } from '../../lib/money'
import { Button } from '../../components/Button'

interface StepReviewProps {
  service: StitchingService
  fabric: FabricChoice
  measurements: MeasurementDraft
  selections: Record<string, string>
  styleNotes: string
  referenceImage: { url: string; path: string } | null
  estimate: number
  onBack: () => void
  onConfirm: () => void
}

export function StepReview({
  service,
  fabric,
  measurements,
  selections,
  styleNotes,
  referenceImage,
  estimate,
  onBack,
  onConfirm,
}: StepReviewProps) {
  const chosenOptions = service.options
    .map((o) => {
      const choice = o.choices.find((c) => c.value === selections[o.key])
      return choice ? { label: o.label, choice } : null
    })
    .filter(Boolean) as { label: string; choice: { label: string; priceDelta: number } }[]

  return (
    <div className="max-w-xl">
      <div className="border border-border rounded-lg bg-surface divide-y divide-border mb-8">
        <div className="p-5">
          <p className="text-xs uppercase tracking-wide text-secondary mb-1">Service</p>
          <p className="font-medium text-primary">{service.name}</p>
        </div>
        <div className="p-5">
          <p className="text-xs uppercase tracking-wide text-secondary mb-1">Fabric</p>
          <p className="text-primary">
            {fabric.source === 'shop'
              ? `${fabric.product.name} — ${formatPKR(fabric.product.price)}`
              : 'You provide the fabric (drop off at the shop)'}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs uppercase tracking-wide text-secondary mb-1">Measurements</p>
          {measurements.type === 'profile' ? (
            <p className="text-primary">Saved profile: {measurements.label}</p>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {MEASUREMENT_FIELDS.filter((f) => measurements.values[f.key] !== undefined).map(
                (f) => (
                  <div key={f.key} className="flex justify-between">
                    <dt className="text-secondary">{f.label}</dt>
                    <dd className="text-primary tabular-nums">
                      {measurements.values[f.key]} {measurements.unit}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          )}
        </div>
        {chosenOptions.length > 0 && (
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-secondary mb-1">Style</p>
            <ul className="text-sm text-primary space-y-0.5">
              {chosenOptions.map((o) => (
                <li key={o.label}>
                  {o.label}: {o.choice.label}
                  {o.choice.priceDelta > 0 && (
                    <span className="text-secondary"> (+{formatPKR(o.choice.priceDelta)})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {(styleNotes || referenceImage) && (
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-secondary mb-1">Notes</p>
            {styleNotes && <p className="text-sm text-primary italic mb-2">"{styleNotes}"</p>}
            {referenceImage && (
              <img
                src={referenceImage.url}
                alt="Reference"
                width={80}
                height={100}
                className="w-20 h-24 object-cover rounded border border-border"
              />
            )}
          </div>
        )}
        <div className="p-5 flex justify-between items-center">
          <div>
            <p className="font-medium text-primary">Estimated total</p>
            <p className="text-xs text-secondary">Final price confirmed at checkout</p>
          </div>
          <p className="text-xl font-semibold text-primary tabular-nums">{formatPKR(estimate)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onConfirm}>
          Add to cart
        </Button>
      </div>
    </div>
  )
}

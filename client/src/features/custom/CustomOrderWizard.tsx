import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useCart } from '../../context/CartContext'
import type { Product } from '../catalog/api'
import type { CustomRequestLine, StitchingService } from './api'
import { computeEstimate } from './estimate'
import { StepService } from './StepService'
import { StepFabric } from './StepFabric'
import { StepMeasurements, type MeasurementDraft } from './StepMeasurements'
import { StepStyle } from './StepStyle'
import { StepReview } from './StepReview'

export type FabricChoice = { source: 'shop'; product: Product } | { source: 'own' }

const STEPS = ['Service', 'Fabric', 'Measurements', 'Style', 'Review'] as const

export function CustomOrderWizard() {
  const navigate = useNavigate()
  const { addCustomItem } = useCart()

  const [step, setStep] = useState(0)
  const [service, setService] = useState<StitchingService | null>(null)
  const [fabric, setFabric] = useState<FabricChoice | null>(null)
  const [measurements, setMeasurements] = useState<MeasurementDraft | null>(null)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [styleNotes, setStyleNotes] = useState('')
  const [referenceImage, setReferenceImage] = useState<{ url: string; path: string } | null>(null)

  const fabricPrice = fabric?.source === 'shop' ? fabric.product.price : 0
  const estimate = service ? computeEstimate(service, selections, fabricPrice) : 0

  function addToCart() {
    if (!service || !fabric || !measurements) return
    const request: CustomRequestLine = {
      kind: 'custom',
      serviceId: service.id,
      optionSelections: Object.entries(selections).map(([key, value]) => ({ key, value })),
      fabric:
        fabric.source === 'shop'
          ? { source: 'shop', productId: fabric.product.id }
          : { source: 'own' },
      ...(measurements.type === 'profile'
        ? { measurementProfileId: measurements.profileId }
        : { measurements: { unit: measurements.unit, values: measurements.values } }),
      ...(styleNotes.trim() ? { styleNotes: styleNotes.trim() } : {}),
      ...(referenceImage ? { referenceImagePath: referenceImage.path } : {}),
    }
    const summaryParts = [
      fabric.source === 'shop' ? `Fabric: ${fabric.product.name}` : 'Own fabric',
      ...Object.entries(selections).map(([key, value]) => {
        const option = service.options.find((o) => o.key === key)
        const choice = option?.choices.find((c) => c.value === value)
        return choice ? choice.label : `${key}: ${value}`
      }),
    ]
    addCustomItem({
      serviceName: service.name,
      summary: summaryParts.join(' · '),
      estimate,
      image: service.image?.url ?? null,
      request,
    })
    navigate('/cart')
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-accent mb-3">Made to measure</p>
      <h2 className="font-display text-5xl font-semibold text-primary mb-3">Custom stitching</h2>
      <p className="text-secondary mb-10 max-w-xl">
        Pick a service, choose your fabric, share your measurements — the tailor takes it from
        there.
      </p>

      <ol className="flex flex-wrap gap-2 mb-10" aria-label="Wizard progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              aria-current={i === step ? 'step' : undefined}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors duration-200 ${
                i < step
                  ? 'bg-gold text-ink'
                  : i === step
                    ? 'bg-ink text-cream shadow-sm'
                    : 'bg-muted text-secondary'
              }`}
            >
              {i + 1}. {label}
            </span>
            {i < STEPS.length - 1 && <span className="text-border" aria-hidden="true">—</span>}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <StepService
          selected={service}
          onSelect={(s) => {
            setService(s)
            setSelections({})
            setMeasurements(null)
            setStep(1)
          }}
        />
      )}
      {step === 1 && service && (
        <StepFabric
          selected={fabric}
          onBack={() => setStep(0)}
          onNext={(f) => {
            setFabric(f)
            setStep(2)
          }}
        />
      )}
      {step === 2 && service && (
        <StepMeasurements
          service={service}
          value={measurements}
          onBack={() => setStep(1)}
          onNext={(m) => {
            setMeasurements(m)
            setStep(3)
          }}
        />
      )}
      {step === 3 && service && (
        <StepStyle
          service={service}
          selections={selections}
          onSelectionsChange={setSelections}
          styleNotes={styleNotes}
          onStyleNotesChange={setStyleNotes}
          referenceImage={referenceImage}
          onReferenceImageChange={setReferenceImage}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}
      {step === 4 && service && fabric && measurements && (
        <StepReview
          service={service}
          fabric={fabric}
          measurements={measurements}
          selections={selections}
          styleNotes={styleNotes}
          referenceImage={referenceImage}
          estimate={estimate}
          onBack={() => setStep(3)}
          onConfirm={addToCart}
        />
      )}
    </div>
  )
}

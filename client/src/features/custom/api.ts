import { apiFetch, apiUpload } from '../../lib/api'
import type { ProductImage } from '../catalog/api'
import type { MeasurementKey } from '../measurements/api'

export interface ServiceOptionChoice {
  value: string
  label: string
  priceDelta: number
}

export interface ServiceOption {
  key: string
  label: string
  choices: ServiceOptionChoice[]
}

export interface StitchingService {
  id: string
  name: string
  description: string
  basePrice: number
  options: ServiceOption[]
  measurementFields: MeasurementKey[]
  image: ProductImage | null
}

/** The exact custom line shape POST /api/orders accepts. */
export interface CustomRequestLine {
  kind: 'custom'
  serviceId: string
  optionSelections: { key: string; value: string }[]
  fabric: { source: 'shop'; productId: string } | { source: 'own' }
  measurementProfileId?: string
  measurements?: { unit: 'cm' | 'in'; values: Partial<Record<MeasurementKey, number>> }
  styleNotes?: string
  referenceImagePath?: string
}

export const customApi = {
  listServices: () => apiFetch<{ items: StitchingService[] }>('/api/services'),
  uploadReference: (file: File) =>
    apiUpload<{ image: ProductImage & { path: string } }>('/api/uploads/reference', file),
}

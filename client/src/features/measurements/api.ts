import { apiFetch } from '../../lib/api'

export const MEASUREMENT_FIELDS = [
  { key: 'neck', label: 'Neck' },
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hip', label: 'Hip' },
  { key: 'shoulder', label: 'Shoulder width' },
  { key: 'sleeve', label: 'Sleeve length' },
  { key: 'shirtLength', label: 'Shirt length' },
  { key: 'trouserLength', label: 'Trouser length' },
  { key: 'inseam', label: 'Inseam' },
  { key: 'thigh', label: 'Thigh' },
] as const

export type MeasurementKey = (typeof MEASUREMENT_FIELDS)[number]['key']

export interface MeasurementProfile {
  id: string
  label: string
  unit: 'cm' | 'in'
  values: Partial<Record<MeasurementKey, number>>
  notes: string
}

export type ProfileInput = Omit<MeasurementProfile, 'id'>

export const measurementsApi = {
  list: () => apiFetch<{ items: MeasurementProfile[] }>('/api/me/measurements'),
  create: (input: ProfileInput) =>
    apiFetch<{ profile: MeasurementProfile }>('/api/me/measurements', {
      method: 'POST',
      body: input,
    }),
  update: (id: string, input: ProfileInput) =>
    apiFetch<{ profile: MeasurementProfile }>(`/api/me/measurements/${id}`, {
      method: 'PATCH',
      body: input,
    }),
  remove: (id: string) =>
    apiFetch<{ ok: true }>(`/api/me/measurements/${id}`, { method: 'DELETE' }),
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { measurementsApi, MEASUREMENT_FIELDS, type MeasurementKey } from '../measurements/api'
import type { StitchingService } from './api'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'

export type MeasurementDraft =
  | { type: 'profile'; profileId: string; label: string }
  | { type: 'inline'; unit: 'cm' | 'in'; values: Partial<Record<MeasurementKey, number>> }

interface StepMeasurementsProps {
  service: StitchingService
  value: MeasurementDraft | null
  onBack: () => void
  onNext: (draft: MeasurementDraft) => void
}

const RANGES = { cm: { min: 10, max: 250 }, in: { min: 4, max: 100 } }

export function StepMeasurements({ service, value, onBack, onNext }: StepMeasurementsProps) {
  const { user } = useAuth()
  const [mode, setMode] = useState<'profile' | 'inline'>(
    value?.type === 'profile' ? 'profile' : 'inline',
  )
  const [profileId, setProfileId] = useState(value?.type === 'profile' ? value.profileId : '')
  const [unit, setUnit] = useState<'cm' | 'in'>(value?.type === 'inline' ? value.unit : 'cm')
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (value?.type !== 'inline') return {}
    const v: Record<string, string> = {}
    for (const [k, n] of Object.entries(value.values)) v[k] = String(n)
    return v
  })
  const [error, setError] = useState('')

  const profiles = useQuery({
    queryKey: ['measurements'],
    queryFn: measurementsApi.list,
    enabled: !!user,
  })

  const neededFields = MEASUREMENT_FIELDS.filter((f) => service.measurementFields.includes(f.key))

  function profileCoversService(profileValues: Partial<Record<MeasurementKey, number>>) {
    return service.measurementFields.every((f) => profileValues[f] !== undefined)
  }

  function handleNext() {
    setError('')
    if (mode === 'profile') {
      const profile = profiles.data?.items.find((p) => p.id === profileId)
      if (!profile) {
        setError('Pick a saved profile or enter measurements below.')
        return
      }
      if (!profileCoversService(profile.values)) {
        setError(
          `"${profile.label}" is missing some measurements this service needs — edit it on your profile page or enter them here.`,
        )
        return
      }
      onNext({ type: 'profile', profileId: profile.id, label: profile.label })
      return
    }
    const parsed: Partial<Record<MeasurementKey, number>> = {}
    const { min, max } = RANGES[unit]
    for (const field of neededFields) {
      const raw = values[field.key]?.trim() ?? ''
      if (raw === '') {
        setError(`"${field.label}" is required for ${service.name}.`)
        return
      }
      const n = Number(raw)
      if (!Number.isFinite(n) || n < min || n > max) {
        setError(`"${field.label}" must be between ${min} and ${max} ${unit}.`)
        return
      }
      parsed[field.key] = n
    }
    onNext({ type: 'inline', unit, values: parsed })
  }

  return (
    <div className="max-w-2xl">
      {error && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </p>
      )}

      {user && (profiles.data?.items.length ?? 0) > 0 && (
        <fieldset className="mb-8">
          <legend className="font-medium text-primary mb-3">Use a saved profile</legend>
          <div className="space-y-2">
            {profiles.data!.items.map((p) => {
              const covers = profileCoversService(p.values)
              return (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 border rounded-lg px-4 py-3 bg-surface cursor-pointer ${
                    mode === 'profile' && profileId === p.id ? 'border-accent' : 'border-border'
                  } ${covers ? '' : 'opacity-60'}`}
                >
                  <input
                    type="radio"
                    name="measurement-source"
                    checked={mode === 'profile' && profileId === p.id}
                    onChange={() => {
                      setMode('profile')
                      setProfileId(p.id)
                    }}
                    className="accent-accent"
                  />
                  <span className="text-sm text-primary">{p.label}</span>
                  {!covers && (
                    <span className="text-xs text-secondary">(missing some fields)</span>
                  )}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}

      <fieldset className="mb-8">
        <legend className="font-medium text-primary mb-3">
          {user && (profiles.data?.items.length ?? 0) > 0 ? 'Or enter measurements' : 'Measurements'}
        </legend>
        {!user && (
          <p className="text-sm text-secondary mb-4">
            <Link to="/login" state={{ from: '/custom' }} className="text-accent hover:underline">
              Sign in
            </Link>{' '}
            to reuse saved measurement profiles.
          </p>
        )}
        <div
          className="flex rounded border border-border overflow-hidden w-fit mb-5"
          role="radiogroup"
          aria-label="Unit"
        >
          {(['cm', 'in'] as const).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={unit === u}
              onClick={() => {
                setUnit(u)
                setMode('inline')
              }}
              className={`px-5 py-2 text-sm transition-colors duration-150 cursor-pointer ${
                unit === u ? 'bg-primary text-white' : 'bg-surface text-secondary hover:text-primary'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {neededFields.map((f) => (
            <TextField
              key={f.key}
              label={`${f.label} (${unit})`}
              id={`w-${f.key}`}
              type="number"
              min={0}
              step="0.5"
              value={values[f.key] ?? ''}
              onChange={(e) => {
                setMode('inline')
                setValues({ ...values, [f.key]: e.target.value })
              }}
            />
          ))}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={handleNext}>
          Continue
        </Button>
      </div>
    </div>
  )
}

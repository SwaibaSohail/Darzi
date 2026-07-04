import { useState, type FormEvent } from 'react'
import { MEASUREMENT_FIELDS, type MeasurementProfile, type ProfileInput } from './api'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'

interface MeasurementFormProps {
  initial?: MeasurementProfile
  onSave: (input: ProfileInput) => void
  onCancel: () => void
  saving: boolean
}

export function MeasurementForm({ initial, onSave, onCancel, saving }: MeasurementFormProps) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [unit, setUnit] = useState<'cm' | 'in'>(initial?.unit ?? 'cm')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [values, setValues] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {}
    for (const f of MEASUREMENT_FIELDS) {
      const n = initial?.values[f.key]
      if (n !== undefined) v[f.key] = String(n)
    }
    return v
  })
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!label.trim()) {
      setError('Give this profile a name, e.g. "My kameez fit".')
      return
    }
    const parsed: Partial<Record<string, number>> = {}
    for (const [key, raw] of Object.entries(values)) {
      if (raw.trim() === '') continue
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) {
        setError(`"${MEASUREMENT_FIELDS.find((f) => f.key === key)?.label}" must be a positive number.`)
        return
      }
      parsed[key] = n
    }
    if (Object.keys(parsed).length === 0) {
      setError('Enter at least one measurement.')
      return
    }
    onSave({ label: label.trim(), unit, values: parsed, notes: notes.trim() })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="border border-border rounded-lg p-6 bg-surface">
      {error && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-4 items-end">
        <TextField
          label="Profile name"
          id="m-label"
          placeholder="My kameez fit"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <div className="mb-5">
          <span className="block text-sm font-medium text-primary mb-1.5">Unit</span>
          <div className="flex rounded border border-border overflow-hidden w-fit" role="radiogroup" aria-label="Measurement unit">
            {(['cm', 'in'] as const).map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={unit === u}
                onClick={() => setUnit(u)}
                className={`px-5 py-2 text-sm transition-colors duration-150 cursor-pointer ${
                  unit === u ? 'bg-primary text-white' : 'bg-surface text-secondary hover:text-primary'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {MEASUREMENT_FIELDS.map((f) => (
          <TextField
            key={f.key}
            label={`${f.label} (${unit})`}
            id={`m-${f.key}`}
            type="number"
            min={0}
            step="0.5"
            value={values[f.key] ?? ''}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          />
        ))}
      </div>

      <div className="mb-6">
        <label htmlFor="m-notes" className="block text-sm font-medium text-primary mb-1.5">
          Notes for the tailor (optional)
        </label>
        <textarea
          id="m-notes"
          rows={2}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Prefer a looser chest, shorter sleeves…"
          className="w-full px-3.5 py-2.5 bg-surface border border-border rounded text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={saving}>
          {initial ? 'Save changes' : 'Save profile'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

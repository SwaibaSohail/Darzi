import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { apiFetch } from '../../lib/api'
import {
  measurementsApi,
  MEASUREMENT_FIELDS,
  type MeasurementProfile,
  type ProfileInput,
} from '../measurements/api'
import { MeasurementForm } from '../measurements/MeasurementForm'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'
import { Skeleton } from '../../components/Skeleton'

function AccountSection() {
  const { profile } = useAuth()
  const [name, setName] = useState(profile?.name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const save = useMutation({
    mutationFn: (body: { name: string; phone: string | null }) =>
      apiFetch('/api/me', { method: 'PATCH', body }),
    onSuccess: () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Save failed'),
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) {
      setError('Name is required.')
      return
    }
    save.mutate({ name: name.trim(), phone: phone.trim() || null })
  }

  return (
    <section className="mb-14">
      <h3 className="font-display text-2xl text-primary mb-6">Account</h3>
      {error && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate className="max-w-md">
        <TextField label="Full name" id="acc-name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField
          label="Phone"
          id="acc-phone"
          type="tel"
          placeholder="+92 300 1234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <div className="flex items-center gap-4">
          <Button type="submit" loading={save.isPending}>
            Save account
          </Button>
          {saved && (
            <span className="text-sm text-green-700" role="status">
              Saved ✓
            </span>
          )}
        </div>
      </form>
    </section>
  )
}

export function ProfilePage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<MeasurementProfile | 'new' | null>(null)

  const { data, isPending } = useQuery({
    queryKey: ['measurements'],
    queryFn: measurementsApi.list,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['measurements'] })
    setEditing(null)
  }

  const create = useMutation({ mutationFn: measurementsApi.create, onSuccess: invalidate })
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProfileInput }) =>
      measurementsApi.update(id, input),
    onSuccess: invalidate,
  })
  const remove = useMutation({ mutationFn: measurementsApi.remove, onSuccess: invalidate })

  function handleSave(input: ProfileInput) {
    if (editing === 'new') create.mutate(input)
    else if (editing) update.mutate({ id: editing.id, input })
  }

  return (
    <div>
      <h2 className="font-display text-4xl font-semibold text-primary mb-10">Your profile</h2>

      <AccountSection />

      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-2xl text-primary">Measurement profiles</h3>
          {editing === null && (
            <Button type="button" onClick={() => setEditing('new')}>
              Add profile
            </Button>
          )}
        </div>

        <p className="text-sm text-secondary mb-6 max-w-xl">
          Save your measurements once and reuse them for custom stitching orders. Ask someone to
          help you measure, or note "tailor will confirm in chat" and we will sort it out together.
        </p>

        {editing !== null && (
          <div className="mb-8">
            <MeasurementForm
              initial={editing === 'new' ? undefined : editing}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
              saving={create.isPending || update.isPending}
            />
          </div>
        )}

        {isPending && <Skeleton className="h-32 w-full" />}

        {data && data.items.length === 0 && editing === null && (
          <div className="text-center py-14 border border-dashed border-border rounded-lg">
            <p className="text-secondary">No measurement profiles yet.</p>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.items.map((p) => (
              <article key={p.id} className="border border-border rounded-lg p-5 bg-surface">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-primary">{p.label}</h4>
                  <span className="text-xs uppercase text-secondary">{p.unit}</span>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
                  {MEASUREMENT_FIELDS.filter((f) => p.values[f.key] !== undefined).map((f) => (
                    <div key={f.key} className="flex justify-between">
                      <dt className="text-secondary">{f.label}</dt>
                      <dd className="text-primary tabular-nums">
                        {p.values[f.key]} {p.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
                {p.notes && <p className="text-sm text-secondary italic mb-4">"{p.notes}"</p>}
                <div className="flex gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="text-accent hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete "${p.label}"?`)) remove.mutate(p.id)
                    }}
                    className="text-secondary hover:text-destructive cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { adminApi, type ServiceInput, type ServiceOption } from './api'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'

interface ChoiceDraft {
  value: string
  label: string
  deltaRupees: string
}

interface OptionDraft {
  key: string
  label: string
  choices: ChoiceDraft[]
}

export function ServiceFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePriceRupees, setBasePriceRupees] = useState('')
  const [fieldsCsv, setFieldsCsv] = useState('')
  const [options, setOptions] = useState<OptionDraft[]>([])
  const [error, setError] = useState('')

  const existing = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: adminApi.listServices,
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit || !existing.data) return
    const service = existing.data.items.find((s) => s.id === id)
    if (!service) return
    setName(service.name)
    setDescription(service.description)
    setBasePriceRupees(String(service.basePrice / 100))
    setFieldsCsv(service.measurementFields.join(', '))
    setOptions(
      service.options.map((o) => ({
        key: o.key,
        label: o.label,
        choices: o.choices.map((c) => ({
          value: c.value,
          label: c.label,
          deltaRupees: String(c.priceDelta / 100),
        })),
      })),
    )
  }, [isEdit, existing.data, id])

  const save = useMutation({
    mutationFn: (input: Partial<ServiceInput>) =>
      isEdit ? adminApi.updateService(id!, input) : adminApi.createService(input as ServiceInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'services'] })
      navigate('/admin/services')
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Save failed'),
  })

  function updateOption(i: number, patch: Partial<OptionDraft>) {
    setOptions(options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
  }

  function updateChoice(oi: number, ci: number, patch: Partial<ChoiceDraft>) {
    setOptions(
      options.map((o, idx) =>
        idx === oi
          ? { ...o, choices: o.choices.map((c, cIdx) => (cIdx === ci ? { ...c, ...patch } : c)) }
          : o,
      ),
    )
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const basePrice = Number(basePriceRupees)
    if (!name.trim() || !description.trim()) {
      setError('Name and description are required.')
      return
    }
    if (!Number.isFinite(basePrice) || basePrice <= 0) {
      setError('Base price must be a positive number of rupees.')
      return
    }
    const parsedOptions: ServiceOption[] = []
    for (const o of options) {
      if (!o.key.trim() || !o.label.trim() || o.choices.length === 0) {
        setError('Every option needs a key, a label, and at least one choice.')
        return
      }
      const choices = []
      for (const c of o.choices) {
        const delta = Number(c.deltaRupees || '0')
        if (!c.value.trim() || !c.label.trim() || !Number.isFinite(delta) || delta < 0) {
          setError(`Option "${o.label}": choices need value, label, and non-negative delta.`)
          return
        }
        choices.push({
          value: c.value.trim(),
          label: c.label.trim(),
          priceDelta: Math.round(delta * 100),
        })
      }
      parsedOptions.push({ key: o.key.trim(), label: o.label.trim(), choices })
    }
    save.mutate({
      name: name.trim(),
      description: description.trim(),
      basePrice: Math.round(basePrice * 100),
      options: parsedOptions,
      measurementFields: fieldsCsv
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
      image: null,
      ...(isEdit ? {} : { active: true }),
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-2xl text-primary">
          {isEdit ? 'Edit service' : 'New service'}
        </h3>
        <Link to="/admin/services" className="text-sm text-secondary hover:text-primary">
          Back to list
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField label="Name" id="s-name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mb-5">
          <label htmlFor="s-desc" className="block text-sm font-medium text-primary mb-1.5">
            Description
          </label>
          <textarea
            id="s-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border rounded text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Base price (Rs)"
            id="s-price"
            type="number"
            min={1}
            value={basePriceRupees}
            onChange={(e) => setBasePriceRupees(e.target.value)}
          />
          <TextField
            label="Measurement fields (comma-sep)"
            id="s-fields"
            placeholder="chest, waist, sleeve"
            value={fieldsCsv}
            onChange={(e) => setFieldsCsv(e.target.value)}
          />
        </div>

        <fieldset className="mb-8">
          <legend className="text-sm font-medium text-primary mb-3">Style options</legend>
          {options.map((o, oi) => (
            <div key={oi} className="border border-border rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <TextField
                  label="Option key"
                  id={`opt-key-${oi}`}
                  placeholder="collar"
                  value={o.key}
                  onChange={(e) => updateOption(oi, { key: e.target.value })}
                />
                <TextField
                  label="Option label"
                  id={`opt-label-${oi}`}
                  placeholder="Collar style"
                  value={o.label}
                  onChange={(e) => updateOption(oi, { label: e.target.value })}
                />
              </div>
              {o.choices.map((c, ci) => (
                <div key={ci} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end mb-2">
                  <TextField
                    label={ci === 0 ? 'Value' : ''}
                    id={`c-val-${oi}-${ci}`}
                    placeholder="ban"
                    value={c.value}
                    onChange={(e) => updateChoice(oi, ci, { value: e.target.value })}
                  />
                  <TextField
                    label={ci === 0 ? 'Label' : ''}
                    id={`c-label-${oi}-${ci}`}
                    placeholder="Ban collar"
                    value={c.label}
                    onChange={(e) => updateChoice(oi, ci, { label: e.target.value })}
                  />
                  <TextField
                    label={ci === 0 ? '+Rs' : ''}
                    id={`c-delta-${oi}-${ci}`}
                    type="number"
                    min={0}
                    value={c.deltaRupees}
                    onChange={(e) => updateChoice(oi, ci, { deltaRupees: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remove choice"
                    onClick={() =>
                      updateOption(oi, { choices: o.choices.filter((_, idx) => idx !== ci) })
                    }
                    className="mb-5 px-3 py-2.5 text-secondary hover:text-destructive cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex gap-4 mt-2">
                <button
                  type="button"
                  onClick={() =>
                    updateOption(oi, {
                      choices: [...o.choices, { value: '', label: '', deltaRupees: '0' }],
                    })
                  }
                  className="text-sm text-accent hover:underline cursor-pointer"
                >
                  + Add choice
                </button>
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, idx) => idx !== oi))}
                  className="text-sm text-secondary hover:text-destructive cursor-pointer"
                >
                  Remove option
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setOptions([
                ...options,
                { key: '', label: '', choices: [{ value: '', label: '', deltaRupees: '0' }] },
              ])
            }
            className="text-sm text-accent hover:underline cursor-pointer"
          >
            + Add option
          </button>
        </fieldset>

        <Button type="submit" loading={save.isPending}>
          {isEdit ? 'Save changes' : 'Create service'}
        </Button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { customApi, type StitchingService } from './api'
import { formatPKR } from '../../lib/money'
import { Button } from '../../components/Button'

interface StepStyleProps {
  service: StitchingService
  selections: Record<string, string>
  onSelectionsChange: (next: Record<string, string>) => void
  styleNotes: string
  onStyleNotesChange: (notes: string) => void
  referenceImage: { url: string; path: string } | null
  onReferenceImageChange: (image: { url: string; path: string } | null) => void
  onBack: () => void
  onNext: () => void
}

export function StepStyle({
  service,
  selections,
  onSelectionsChange,
  styleNotes,
  onStyleNotesChange,
  referenceImage,
  onReferenceImageChange,
  onBack,
  onNext,
}: StepStyleProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const res = await customApi.uploadReference(file)
      onReferenceImageChange({ url: res.image.url, path: res.image.path })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      {error && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </p>
      )}

      {service.options.map((option) => (
        <fieldset key={option.key} className="mb-7">
          <legend className="font-medium text-primary mb-3">{option.label}</legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={option.label}>
            {option.choices.map((choice) => {
              const active = selections[option.key] === choice.value
              return (
                <button
                  key={choice.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onSelectionsChange({ ...selections, [option.key]: choice.value })}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    active
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface border-border text-secondary hover:border-accent'
                  }`}
                >
                  {choice.label}
                  {choice.priceDelta > 0 && (
                    <span className="ml-1 text-xs opacity-80">+{formatPKR(choice.priceDelta)}</span>
                  )}
                </button>
              )
            })}
          </div>
        </fieldset>
      ))}

      <div className="mb-7">
        <label htmlFor="w-notes" className="block font-medium text-primary mb-2">
          Style notes for the tailor <span className="text-secondary font-normal">(optional)</span>
        </label>
        <textarea
          id="w-notes"
          rows={3}
          maxLength={1000}
          value={styleNotes}
          onChange={(e) => onStyleNotesChange(e.target.value)}
          placeholder="Looser around the chest, side pockets, gold buttons…"
          className="w-full px-3.5 py-2.5 bg-surface border border-border rounded text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="mb-9">
        <p className="font-medium text-primary mb-2">
          Reference photo <span className="text-secondary font-normal">(optional)</span>
        </p>
        {user ? (
          <>
            {referenceImage && (
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={referenceImage.url}
                  alt="Reference preview"
                  width={80}
                  height={100}
                  className="w-20 h-24 object-cover rounded border border-border"
                />
                <button
                  type="button"
                  onClick={() => onReferenceImageChange(null)}
                  className="text-sm text-secondary hover:text-destructive cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload reference photo"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className="block text-sm text-secondary file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-primary file:text-white file:cursor-pointer"
            />
            {uploading && <p className="text-sm text-secondary mt-2">Uploading…</p>}
          </>
        ) : (
          <p className="text-sm text-secondary">
            <Link to="/login" state={{ from: '/custom' }} className="text-accent hover:underline">
              Sign in
            </Link>{' '}
            to attach a reference photo.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="button" onClick={onNext} disabled={uploading}>
          Review order
        </Button>
      </div>
    </div>
  )
}

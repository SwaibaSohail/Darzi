import type { InputHTMLAttributes } from 'react'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
}

export function TextField({ label, id, error, ...inputProps }: TextFieldProps) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-medium text-primary mb-1.5">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full px-3.5 py-2.5 bg-surface border border-border rounded text-primary placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-150"
        {...inputProps}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

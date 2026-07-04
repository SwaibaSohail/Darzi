import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline'
  loading?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary: 'bg-primary text-white hover:bg-accent',
  outline: 'border border-border text-primary hover:border-accent hover:text-accent bg-surface',
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button disabled={disabled || loading} className={`${base} ${variants[variant]}`} {...props}>
      {loading && (
        <span
          aria-hidden="true"
          className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
        />
      )}
      {children}
    </button>
  )
}

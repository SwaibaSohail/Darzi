import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline'
  loading?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium tracking-wide transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const variants = {
  primary: 'bg-primary text-white shadow-sm hover:bg-accent hover:shadow-md',
  outline: 'border border-border text-primary bg-surface hover:border-accent hover:text-accent',
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

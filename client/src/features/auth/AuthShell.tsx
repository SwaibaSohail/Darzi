import type { ReactNode } from 'react'

interface AuthShellProps {
  children: ReactNode
}

/** Split-panel frame for sign-in/sign-up: dark brand panel + form side. */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="max-w-4xl mx-auto grid lg:grid-cols-[0.9fr_1.1fr] rounded-2xl overflow-hidden border border-border shadow-lg bg-surface mt-2">
      <aside className="relative bg-ink text-cream p-8 sm:p-10 flex flex-col justify-between min-h-40 lg:min-h-full overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 12px, #D4A63F 12px, #D4A63F 13px)',
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-20 blur-3xl"
          aria-hidden="true"
          style={{ background: 'radial-gradient(circle, #D4A63F 0%, transparent 70%)' }}
        />
        <div className="relative">
          <p className="font-display text-3xl border-b-2 border-gold inline-block pb-0.5 mb-6">
            Darzi
          </p>
          <p className="hidden lg:block font-display text-2xl italic leading-snug text-cream/90">
            "A good tailor keeps
            <br />
            your measurements.
            <br />
            A great one keeps
            <br />
            your confidence."
          </p>
        </div>
        <div className="relative hidden lg:block">
          <svg width="140" height="40" viewBox="0 0 140 40" fill="none" aria-hidden="true" className="text-gold/70 mb-4">
            <path
              d="M4 30 C 30 8, 60 36, 90 16 S 136 14, 136 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="6 5"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-xs text-cream/60 tracking-wide">
            Custom stitching · Live tracking · Tailor chat
          </p>
        </div>
      </aside>
      <div className="p-8 sm:p-10">{children}</div>
    </div>
  )
}

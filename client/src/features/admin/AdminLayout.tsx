import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../../context/AuthContext'

const tabs = [
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/services', label: 'Services' },
]

export function AdminLayout() {
  const { profile } = useAuth()
  return (
    <div>
      <div className="relative -mx-6 sm:-mx-8 -mt-12 sm:-mt-16 mb-10 bg-ink text-cream overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.05]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, transparent, transparent 12px, #D4A63F 12px, #D4A63F 13px)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 pt-10 pb-0">
          <p className="text-xs uppercase tracking-[0.22em] text-gold mb-2">The workshop</p>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-4xl font-semibold">Shop admin</h2>
            {profile && <p className="text-sm text-cream/60">Signed in as {profile.name}</p>}
          </div>
          <nav className="flex gap-1 mt-8" aria-label="Admin sections">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                className={({ isActive }) =>
                  `px-5 py-2.5 text-sm rounded-t-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-background text-primary font-medium'
                      : 'text-cream/70 hover:text-gold'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
      <Outlet />
    </div>
  )
}

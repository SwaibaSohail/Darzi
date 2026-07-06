import { NavLink, Outlet } from 'react-router'

const tabs = [
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/services', label: 'Services' },
]

export function AdminLayout() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-4xl font-semibold text-primary">Shop admin</h2>
      </div>
      <nav className="flex gap-2 border-b border-border mb-8" aria-label="Admin sections">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `px-4 py-2 text-sm border-b-2 -mb-px transition-colors duration-150 ${
                isActive
                  ? 'border-accent text-primary font-medium'
                  : 'border-transparent text-secondary hover:text-primary'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

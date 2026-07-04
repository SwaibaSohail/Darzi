import { Link, NavLink, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { HomePage } from './features/home/HomePage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { ProductsPage } from './features/catalog/ProductsPage'
import { ProductDetailPage } from './features/catalog/ProductDetailPage'
import { RequireAdmin } from './features/auth/guards'
import { AdminLayout } from './features/admin/AdminLayout'
import { ProductsAdminPage } from './features/admin/ProductsAdminPage'
import { ProductFormPage } from './features/admin/ProductFormPage'
import { ServicesAdminPage } from './features/admin/ServicesAdminPage'
import { ServiceFormPage } from './features/admin/ServiceFormPage'

function Nav() {
  const { user, profile, isAdmin, logout } = useAuth()
  return (
    <nav className="flex items-center gap-6 text-sm">
      <NavLink
        to="/products"
        className={({ isActive }) =>
          `transition-colors duration-150 ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
        }
      >
        Collection
      </NavLink>
      {isAdmin && (
        <NavLink
          to="/admin/products"
          className={({ isActive }) =>
            `transition-colors duration-150 ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
          }
        >
          Admin
        </NavLink>
      )}
      {user ? (
        <>
          <span className="text-secondary">{profile?.name ?? user.email}</span>
          <button
            type="button"
            onClick={logout}
            className="text-primary hover:text-accent transition-colors duration-150 cursor-pointer"
          >
            Sign out
          </button>
        </>
      ) : (
        <Link to="/login" className="text-primary hover:text-accent transition-colors duration-150">
          Sign in
        </Link>
      )}
    </nav>
  )
}

function App() {
  return (
    <>
      <header className="px-8 py-6 border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <h1 className="font-display text-3xl text-primary inline-block border-b-2 border-accent pb-0.5">
              Darzi
            </h1>
          </Link>
          <Nav />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route
            path="/custom"
            element={
              <div className="text-center py-20">
                <p className="font-display text-2xl text-primary">Custom stitching arrives soon.</p>
              </div>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<ProductsAdminPage />} />
            <Route path="products" element={<ProductsAdminPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="services" element={<ServicesAdminPage />} />
            <Route path="services/new" element={<ServiceFormPage />} />
            <Route path="services/:id/edit" element={<ServiceFormPage />} />
          </Route>
        </Routes>
      </main>
    </>
  )
}

export default App

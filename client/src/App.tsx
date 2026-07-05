import { Link, NavLink, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { HomePage } from './features/home/HomePage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'
import { ProductsPage } from './features/catalog/ProductsPage'
import { ProductDetailPage } from './features/catalog/ProductDetailPage'
import { RequireAuth, RequireAdmin } from './features/auth/guards'
import { ProfilePage } from './features/profile/ProfilePage'
import { useCart } from './context/CartContext'
import { CartPage } from './features/cart/CartPage'
import { CheckoutPage } from './features/checkout/CheckoutPage'
import { MyOrdersPage } from './features/orders/MyOrdersPage'
import { OrderDetailPage } from './features/orders/OrderDetailPage'
import { CustomOrderWizard } from './features/custom/CustomOrderWizard'
import { AdminLayout } from './features/admin/AdminLayout'
import { ProductsAdminPage } from './features/admin/ProductsAdminPage'
import { ProductFormPage } from './features/admin/ProductFormPage'
import { ServicesAdminPage } from './features/admin/ServicesAdminPage'
import { ServiceFormPage } from './features/admin/ServiceFormPage'
import { OrdersAdminPage } from './features/admin/OrdersAdminPage'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[13px] uppercase tracking-[0.14em] transition-colors duration-150 ${
    isActive ? 'text-accent' : 'text-primary hover:text-accent'
  }`

function Nav() {
  const { user, profile, isAdmin, logout } = useAuth()
  const { count } = useCart()
  return (
    <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <NavLink to="/products" className={navLinkClass}>
        Collection
      </NavLink>
      <NavLink to="/custom" className={navLinkClass}>
        Custom
      </NavLink>
      <NavLink
        to="/cart"
        className={({ isActive }) =>
          `relative text-[13px] uppercase tracking-[0.14em] transition-colors duration-150 ${
            isActive ? 'text-accent' : 'text-primary hover:text-accent'
          }`
        }
      >
        Cart
        {count > 0 && (
          <span
            aria-label={`${count} items in cart`}
            className="absolute -top-2.5 -right-3.5 min-w-4 h-4 px-1 bg-accent text-white text-[10px] leading-4 text-center rounded-full font-medium tracking-normal"
          >
            {count}
          </span>
        )}
      </NavLink>
      {user && (
        <NavLink to="/orders" className={navLinkClass}>
          Orders
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin/products" className={navLinkClass}>
          Admin
        </NavLink>
      )}
      <span className="hidden sm:block w-px h-4 bg-border" aria-hidden="true" />
      {user ? (
        <>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `text-[13px] tracking-wide transition-colors duration-150 ${
                isActive ? 'text-accent' : 'text-secondary hover:text-accent'
              }`
            }
          >
            {profile?.name ?? user.email}
          </NavLink>
          <button
            type="button"
            onClick={logout}
            className="text-[13px] uppercase tracking-[0.14em] text-primary hover:text-accent transition-colors duration-150 cursor-pointer"
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          to="/login"
          className="text-[13px] uppercase tracking-[0.14em] px-4 py-1.5 border border-primary text-primary rounded-full hover:bg-primary hover:text-white transition-colors duration-200"
        >
          Sign in
        </Link>
      )}
    </nav>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 grid gap-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-2xl text-primary mb-2">Darzi</p>
          <p className="text-sm text-secondary max-w-xs leading-relaxed">
            Bespoke tailoring, made to your measurements. Every stitch tells your story.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-primary mb-3">Explore</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/products" className="text-secondary hover:text-accent transition-colors duration-150">
                The collection
              </Link>
            </li>
            <li>
              <Link to="/custom" className="text-secondary hover:text-accent transition-colors duration-150">
                Custom stitching
              </Link>
            </li>
            <li>
              <Link to="/profile" className="text-secondary hover:text-accent transition-colors duration-150">
                Measurement profiles
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-primary mb-3">Atelier</p>
          <p className="text-sm text-secondary leading-relaxed">
            Cash on delivery across Pakistan.
            <br />
            Chat with the tailor on every order.
          </p>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="max-w-6xl mx-auto px-6 sm:px-8 py-5 text-xs text-secondary">
          © {new Date().getFullYear()} Darzi — stitched with care.
        </p>
      </div>
    </footer>
  )
}

function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-y-2">
          <Link
            to="/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
          >
            <h1 className="font-display text-3xl leading-none text-primary inline-block border-b-2 border-accent pb-0.5">
              Darzi
            </h1>
          </Link>
          <Nav />
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 sm:px-8 py-12 sm:py-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/custom" element={<CustomOrderWizard />} />
          <Route path="/cart" element={<CartPage />} />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <MyOrdersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <RequireAuth>
                <OrderDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
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
            <Route index element={<OrdersAdminPage />} />
            <Route path="orders" element={<OrdersAdminPage />} />
            <Route path="products" element={<ProductsAdminPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="services" element={<ServicesAdminPage />} />
            <Route path="services/new" element={<ServiceFormPage />} />
            <Route path="services/:id/edit" element={<ServiceFormPage />} />
          </Route>
          <Route
            path="*"
            element={
              <div className="text-center py-24">
                <p className="font-display text-6xl text-primary mb-3">404</p>
                <p className="text-secondary mb-6">This page does not exist.</p>
                <Link to="/" className="text-accent hover:underline">
                  Back home
                </Link>
              </div>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App

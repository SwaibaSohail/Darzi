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

function Nav() {
  const { user, profile, isAdmin, logout } = useAuth()
  const { count } = useCart()
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
      <NavLink
        to="/custom"
        className={({ isActive }) =>
          `transition-colors duration-150 ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
        }
      >
        Custom
      </NavLink>
      <NavLink
        to="/cart"
        className={({ isActive }) =>
          `relative transition-colors duration-150 ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
        }
      >
        Cart
        {count > 0 && (
          <span
            aria-label={`${count} items in cart`}
            className="absolute -top-2 -right-3 min-w-4 h-4 px-1 bg-accent text-white text-[10px] leading-4 text-center rounded-full"
          >
            {count}
          </span>
        )}
      </NavLink>
      {user && (
        <NavLink
          to="/orders"
          className={({ isActive }) =>
            `transition-colors duration-150 ${isActive ? 'text-accent' : 'text-primary hover:text-accent'}`
          }
        >
          Orders
        </NavLink>
      )}
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
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `transition-colors duration-150 ${isActive ? 'text-accent' : 'text-secondary hover:text-accent'}`
            }
          >
            {profile?.name ?? user.email}
          </NavLink>
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
        </Routes>
      </main>
    </>
  )
}

export default App

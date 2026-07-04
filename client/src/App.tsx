import { Link, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { HomePage } from './features/home/HomePage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'

function Nav() {
  const { user, profile, logout } = useAuth()
  return (
    <nav className="flex items-center gap-6 text-sm">
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
        </Routes>
      </main>
    </>
  )
}

export default App

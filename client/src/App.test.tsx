import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import App from './App'

vi.mock('./lib/firebase', () => ({
  auth: {},
  googleProvider: {},
}))

vi.mock('firebase/auth', () => ({
  onIdTokenChanged: (_auth: unknown, cb: (u: null) => void) => {
    cb(null)
    return () => {}
  },
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}))

function renderApp(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('renders the brand and home hero', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: 'Darzi' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tailored to you.' })).toBeInTheDocument()
  })

  it('shows Sign in link when logged out', () => {
    renderApp('/')
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('renders the login page at /login', () => {
    renderApp('/login')
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })
})

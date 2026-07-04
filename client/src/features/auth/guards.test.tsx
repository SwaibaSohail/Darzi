import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { RequireAuth, RequireAdmin } from './guards'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

function authValue(overrides: Partial<ReturnType<typeof useAuth>>) {
  return {
    user: null,
    profile: null,
    isAdmin: false,
    loading: false,
    register: vi.fn(),
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  } as ReturnType<typeof useAuth>
}

function renderGuarded(guard: 'auth' | 'admin') {
  const Guard = guard === 'auth' ? RequireAuth : RequireAdmin
  return render(
    <MemoryRouter initialEntries={['/secret']}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/" element={<p>home page</p>} />
        <Route
          path="/secret"
          element={
            <Guard>
              <p>secret content</p>
            </Guard>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  mockUseAuth.mockReset()
})

describe('RequireAuth', () => {
  it('redirects unauthenticated users to /login', () => {
    mockUseAuth.mockReturnValue(authValue({ user: null }))
    renderGuarded('auth')
    expect(screen.getByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
  })

  it('renders children for authenticated users', () => {
    mockUseAuth.mockReturnValue(authValue({ user: { uid: 'u1' } as never }))
    renderGuarded('auth')
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })

  it('renders nothing while loading', () => {
    mockUseAuth.mockReturnValue(authValue({ loading: true }))
    renderGuarded('auth')
    expect(screen.queryByText('secret content')).not.toBeInTheDocument()
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
  })
})

describe('RequireAdmin', () => {
  it('redirects non-admin users to home', () => {
    mockUseAuth.mockReturnValue(authValue({ user: { uid: 'u1' } as never, isAdmin: false }))
    renderGuarded('admin')
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('renders children for admins', () => {
    mockUseAuth.mockReturnValue(authValue({ user: { uid: 'a1' } as never, isAdmin: true }))
    renderGuarded('admin')
    expect(screen.getByText('secret content')).toBeInTheDocument()
  })
})

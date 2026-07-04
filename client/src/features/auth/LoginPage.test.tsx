import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { LoginPage } from './LoginPage'
import { useAuth } from '../../context/AuthContext'

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)
const login = vi.fn()

beforeEach(() => {
  login.mockReset()
  mockUseAuth.mockReturnValue({
    user: null,
    profile: null,
    isAdmin: false,
    loading: false,
    register: vi.fn(),
    login,
    loginWithGoogle: vi.fn(),
    logout: vi.fn(),
  } as ReturnType<typeof useAuth>)
})

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('shows validation errors on empty submit and does not call login', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('rejects malformed emails', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('submits trimmed credentials', async () => {
    login.mockResolvedValue(undefined)
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'ali@test.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(login).toHaveBeenCalledWith('ali@test.com', 'password123')
  })

  it('shows a friendly message on auth failure', async () => {
    login.mockRejectedValue({ code: 'auth/invalid-credential' })
    renderLogin()
    await userEvent.type(screen.getByLabelText('Email'), 'ali@test.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass1')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
  })
})

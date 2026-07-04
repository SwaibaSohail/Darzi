import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'
import { GoogleButton } from './GoogleButton'
import { firebaseErrorMessage } from './firebaseErrors'

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  function validate(): boolean {
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setPending(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      setFormError(firebaseErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  async function handleGoogle() {
    setFormError('')
    setPending(true)
    try {
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      setFormError(firebaseErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h2 className="font-display text-4xl font-semibold text-primary mb-8">Sign in</h2>
      {formError && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {formError}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <TextField
          label="Password"
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" loading={pending}>
          Sign in
        </Button>
      </form>
      <div className="my-6 flex items-center gap-4 text-sm text-secondary">
        <span className="flex-1 border-t border-border" aria-hidden="true" />
        or
        <span className="flex-1 border-t border-border" aria-hidden="true" />
      </div>
      <GoogleButton onClick={handleGoogle} disabled={pending} />
      <p className="mt-8 text-sm text-secondary">
        New to Darzi?{' '}
        <Link to="/register" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}

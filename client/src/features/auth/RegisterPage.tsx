import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'
import { GoogleButton } from './GoogleButton'
import { AuthShell } from './AuthShell'
import { firebaseErrorMessage } from './firebaseErrors'

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({})
  const [formError, setFormError] = useState('')
  const [pending, setPending] = useState(false)

  function validate(): boolean {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Name is required'
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    else if (password.length < 8) next.password = 'Password must be at least 8 characters'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (!validate()) return
    setPending(true)
    try {
      await register(name.trim(), email.trim(), password)
      navigate('/', { replace: true })
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
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(firebaseErrorMessage(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthShell>
      <p className="text-xs uppercase tracking-[0.22em] text-wine mb-3">Join the atelier</p>
      <h2 className="font-display text-4xl font-semibold text-primary mb-8">Create account</h2>
      {formError && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {formError}
        </p>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full name"
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <Button type="submit" loading={pending}>
          Create account
        </Button>
      </form>
      <div className="my-6 flex items-center gap-4 text-sm text-secondary">
        <span className="flex-1 border-t border-border" aria-hidden="true" />
        or
        <span className="flex-1 border-t border-border" aria-hidden="true" />
      </div>
      <GoogleButton onClick={handleGoogle} disabled={pending} label="Sign up with Google" />
      <p className="mt-8 text-sm text-secondary">
        Already have an account?{' '}
        <Link to="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}

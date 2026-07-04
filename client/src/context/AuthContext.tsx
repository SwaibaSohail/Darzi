import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onIdTokenChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { apiFetch } from '../lib/api'

export interface Profile {
  email: string | null
  name: string
  phone: string | null
  address: { line1: string; city: string; postal: string } | null
  role: 'customer' | 'admin'
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  loading: boolean
  register: (name: string, email: string, password: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface MeResponse {
  profile: Profile
  isAdmin: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      setUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setIsAdmin(false)
        setLoading(false)
        return
      }
      try {
        const me = await apiFetch<MeResponse>('/api/me')
        setProfile(me.profile)
        setIsAdmin(me.isAdmin)
      } catch (err) {
        console.warn('Failed to load profile', err)
        setProfile(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function register(name: string, email: string, password: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    // refresh so the new displayName lands in the token before /me bootstraps
    await cred.user.getIdToken(true)
  }

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function loginWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, loading, register, login, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

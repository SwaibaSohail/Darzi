import { getDb, serverTimestamp } from '../../config/firebase.js'
import type { UpdateMeInput } from './schemas.js'

export interface UserProfile {
  email: string | null
  name: string
  phone: string | null
  address: { line1: string; city: string; postal: string } | null
  role: 'customer' | 'admin'
}

interface TokenInfo {
  uid: string
  email: string | null
  name?: string
}

export async function getOrCreateUser(token: TokenInfo): Promise<UserProfile> {
  const ref = getDb().collection('users').doc(token.uid)
  const snap = await ref.get()
  if (snap.exists) {
    return snap.data() as UserProfile
  }
  const profile: UserProfile = {
    email: token.email,
    name: token.name ?? token.email?.split('@')[0] ?? 'Customer',
    phone: null,
    address: null,
    role: 'customer',
  }
  await ref.set({ ...profile, createdAt: serverTimestamp() })
  return profile
}

export async function updateUser(uid: string, input: UpdateMeInput): Promise<UserProfile> {
  const ref = getDb().collection('users').doc(uid)
  await ref.update({ ...input, updatedAt: serverTimestamp() })
  const snap = await ref.get()
  return snap.data() as UserProfile
}

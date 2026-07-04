import { getDb, serverTimestamp } from '../../config/firebase.js'
import { AppError } from '../../lib/errors.js'
import { MAX_PROFILES_PER_USER } from './schemas.js'

export interface MeasurementProfile {
  id: string
  userId: string
  label: string
  unit: 'cm' | 'in'
  values: Record<string, number>
  notes: string
}

type ProfileInput = Omit<MeasurementProfile, 'id' | 'userId'>

const COLLECTION = 'measurementProfiles'

export async function listProfiles(userId: string): Promise<MeasurementProfile[]> {
  const snap = await getDb().collection(COLLECTION).where('userId', '==', userId).get()
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as MeasurementProfile)
}

export async function createProfile(
  userId: string,
  input: ProfileInput,
): Promise<MeasurementProfile> {
  const existing = await listProfiles(userId)
  if (existing.length >= MAX_PROFILES_PER_USER) {
    throw new AppError(400, 'LIMIT', `Maximum ${MAX_PROFILES_PER_USER} profiles allowed`)
  }
  const ref = getDb().collection(COLLECTION).doc()
  await ref.set({ userId, ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { id: ref.id, userId, ...input }
}

/** Returns the profile only if owned by userId — missing and foreign are both null. */
async function getOwnedProfile(userId: string, id: string) {
  const ref = getDb().collection(COLLECTION).doc(id)
  const snap = await ref.get()
  if (!snap.exists) return null
  const data = snap.data() as Omit<MeasurementProfile, 'id'>
  if (data.userId !== userId) return null
  return { ref, data }
}

export async function updateProfile(
  userId: string,
  id: string,
  input: ProfileInput,
): Promise<MeasurementProfile | null> {
  const owned = await getOwnedProfile(userId, id)
  if (!owned) return null
  await owned.ref.update({ ...input, updatedAt: serverTimestamp() })
  return { id, userId, ...input }
}

export async function deleteProfile(userId: string, id: string): Promise<boolean> {
  const owned = await getOwnedProfile(userId, id)
  if (!owned) return false
  await owned.ref.delete()
  return true
}

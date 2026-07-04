import { getDb } from '../../config/firebase.js'
import type { StitchingService } from '../products/types.js'

export async function listServices(): Promise<StitchingService[]> {
  const snap = await getDb().collection('services').orderBy('basePrice', 'asc').get()
  return snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as StitchingService)
    .filter((s) => s.active)
}

export async function getService(id: string): Promise<StitchingService | null> {
  const doc = await getDb().collection('services').doc(id).get()
  if (!doc.exists) return null
  const service = { id: doc.id, ...doc.data() } as StitchingService
  return service.active ? service : null
}

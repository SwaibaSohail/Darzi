import { getDb, serverTimestamp } from '../../config/firebase.js'
import type { Product, StitchingService } from './types.js'

type ProductInput = Omit<Product, 'id'>
type ServiceInput = Omit<StitchingService, 'id'>

export async function listAllProducts(): Promise<Product[]> {
  const snap = await getDb().collection('products').orderBy('createdAt', 'desc').get()
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const ref = getDb().collection('products').doc()
  await ref.set({ ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { id: ref.id, ...input }
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<Product | null> {
  const ref = getDb().collection('products').doc(id)
  const snap = await ref.get()
  if (!snap.exists) return null
  await ref.update({ ...input, updatedAt: serverTimestamp() })
  const updated = await ref.get()
  return { id, ...updated.data() } as Product
}

export async function softDeleteProduct(id: string): Promise<boolean> {
  const ref = getDb().collection('products').doc(id)
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.update({ active: false, updatedAt: serverTimestamp() })
  return true
}

export async function listAllServices(): Promise<StitchingService[]> {
  const snap = await getDb().collection('services').orderBy('basePrice', 'asc').get()
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as StitchingService)
}

export async function createService(input: ServiceInput): Promise<StitchingService> {
  const ref = getDb().collection('services').doc()
  await ref.set({ ...input, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  return { id: ref.id, ...input }
}

export async function updateService(
  id: string,
  input: Partial<ServiceInput>,
): Promise<StitchingService | null> {
  const ref = getDb().collection('services').doc(id)
  const snap = await ref.get()
  if (!snap.exists) return null
  await ref.update({ ...input, updatedAt: serverTimestamp() })
  const updated = await ref.get()
  return { id, ...updated.data() } as StitchingService
}

export async function softDeleteService(id: string): Promise<boolean> {
  const ref = getDb().collection('services').doc(id)
  const snap = await ref.get()
  if (!snap.exists) return false
  await ref.update({ active: false, updatedAt: serverTimestamp() })
  return true
}

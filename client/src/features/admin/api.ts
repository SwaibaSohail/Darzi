import { apiFetch, apiUpload } from '../../lib/api'
import type { Product, ProductImage } from '../catalog/api'

export interface ServiceOptionChoice {
  value: string
  label: string
  priceDelta: number
}

export interface ServiceOption {
  key: string
  label: string
  choices: ServiceOptionChoice[]
}

export interface StitchingService {
  id: string
  name: string
  description: string
  basePrice: number
  options: ServiceOption[]
  measurementFields: string[]
  image: ProductImage | null
  active: boolean
}

export interface AdminProduct extends Product {
  active: boolean
}

export type ProductInput = Omit<AdminProduct, 'id'>
export type ServiceInput = Omit<StitchingService, 'id'>

export const adminApi = {
  listProducts: () => apiFetch<{ items: AdminProduct[] }>('/api/admin/products'),
  createProduct: (input: ProductInput) =>
    apiFetch<{ product: AdminProduct }>('/api/admin/products', { method: 'POST', body: input }),
  updateProduct: (id: string, input: Partial<ProductInput>) =>
    apiFetch<{ product: AdminProduct }>(`/api/admin/products/${id}`, {
      method: 'PATCH',
      body: input,
    }),
  deleteProduct: (id: string) =>
    apiFetch<{ ok: true }>(`/api/admin/products/${id}`, { method: 'DELETE' }),

  listServices: () => apiFetch<{ items: StitchingService[] }>('/api/admin/services'),
  createService: (input: ServiceInput) =>
    apiFetch<{ service: StitchingService }>('/api/admin/services', { method: 'POST', body: input }),
  updateService: (id: string, input: Partial<ServiceInput>) =>
    apiFetch<{ service: StitchingService }>(`/api/admin/services/${id}`, {
      method: 'PATCH',
      body: input,
    }),
  deleteService: (id: string) =>
    apiFetch<{ ok: true }>(`/api/admin/services/${id}`, { method: 'DELETE' }),

  uploadProductImage: (file: File) =>
    apiUpload<{ image: ProductImage }>('/api/admin/uploads/product', file),
}

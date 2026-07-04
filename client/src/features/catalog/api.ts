import { apiFetch } from '../../lib/api'

export interface ProductImage {
  url: string
  path: string | null
}

export interface Product {
  id: string
  name: string
  description: string
  category: 'ready-made' | 'fabric'
  subcategory: string
  price: number
  sizes: string[]
  images: ProductImage[]
  stock: number
}

export interface ProductPage {
  items: Product[]
  nextCursor: string | null
}

export interface CatalogFilters {
  category?: 'ready-made' | 'fabric'
  search?: string
}

export function fetchProducts(filters: CatalogFilters): Promise<ProductPage> {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  params.set('limit', '24')
  return apiFetch<ProductPage>(`/api/products?${params.toString()}`)
}

export function fetchProduct(id: string): Promise<{ product: Product }> {
  return apiFetch<{ product: Product }>(`/api/products/${id}`)
}

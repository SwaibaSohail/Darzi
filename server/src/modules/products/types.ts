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
  price: number // integer paisa
  sizes: string[]
  images: ProductImage[]
  stock: number
  active: boolean
}

export interface ServiceOptionChoice {
  value: string
  label: string
  priceDelta: number // integer paisa
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
  basePrice: number // integer paisa
  options: ServiceOption[]
  measurementFields: string[]
  image: ProductImage | null
  active: boolean
}

import { getDb } from '../../config/firebase.js'
import type { Product } from './types.js'

export interface ListProductsQuery {
  category?: 'ready-made' | 'fabric'
  subcategory?: string
  search?: string
  limit: number
  cursor?: string
}

export interface ProductPage {
  items: Product[]
  nextCursor: string | null
}

// Single-shop catalog stays small (well under a few hundred docs), so we read
// the ordered collection once and filter in memory. This avoids a pile of
// composite indexes; if the catalog ever grows past ~500 docs, move the
// category/active filters into the query and declare indexes.
export async function listProducts(query: ListProductsQuery): Promise<ProductPage> {
  const snap = await getDb().collection('products').orderBy('createdAt', 'desc').get()

  let items = snap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as Product)
    .filter((p) => p.active)

  if (query.category) items = items.filter((p) => p.category === query.category)
  if (query.subcategory) items = items.filter((p) => p.subcategory === query.subcategory)
  if (query.search) {
    const needle = query.search.toLowerCase()
    items = items.filter((p) => p.name.toLowerCase().includes(needle))
  }

  let start = 0
  if (query.cursor) {
    const idx = items.findIndex((p) => p.id === query.cursor)
    if (idx >= 0) start = idx + 1
  }
  const page = items.slice(start, start + query.limit)
  const nextCursor = start + query.limit < items.length ? page[page.length - 1].id : null

  return { items: page, nextCursor }
}

export async function getProduct(id: string): Promise<Product | null> {
  const doc = await getDb().collection('products').doc(id).get()
  if (!doc.exists) return null
  const product = { id: doc.id, ...doc.data() } as Product
  return product.active ? product : null
}

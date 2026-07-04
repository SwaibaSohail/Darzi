import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProductsPage } from './ProductsPage'
import { fetchProducts, type Product } from './api'

vi.mock('./api', async (importOriginal) => {
  const original = await importOriginal<typeof import('./api')>()
  return { ...original, fetchProducts: vi.fn(), fetchProduct: vi.fn() }
})

const mockFetchProducts = vi.mocked(fetchProducts)

function product(id: string, over: Partial<Product> = {}): Product {
  return {
    id,
    name: `Product ${id}`,
    description: 'desc',
    category: 'ready-made',
    subcategory: 'kameez',
    price: 450000,
    sizes: ['M'],
    images: [],
    stock: 5,
    ...over,
  }
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={['/products']}>
      <QueryClientProvider client={qc}>
        <ProductsPage />
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mockFetchProducts.mockReset()
})

describe('ProductsPage', () => {
  it('renders product cards with formatted prices', async () => {
    mockFetchProducts.mockResolvedValue({ items: [product('a'), product('b')], nextCursor: null })
    renderPage()
    expect(await screen.findByText('Product a')).toBeInTheDocument()
    expect(screen.getByText('Product b')).toBeInTheDocument()
    expect(screen.getAllByText(/4,500/)).toHaveLength(2)
  })

  it('shows an empty state when nothing matches', async () => {
    mockFetchProducts.mockResolvedValue({ items: [], nextCursor: null })
    renderPage()
    expect(await screen.findByText('Nothing here yet')).toBeInTheDocument()
  })

  it('shows an error state with retry on failure', async () => {
    mockFetchProducts.mockRejectedValue(new Error('boom'))
    renderPage()
    expect(await screen.findByText('Could not load the collection.')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })
})

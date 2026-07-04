import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router'
import { adminApi, type ProductInput } from './api'
import type { ProductImage } from '../catalog/api'
import { TextField } from '../../components/TextField'
import { Button } from '../../components/Button'

const emptyForm = {
  name: '',
  description: '',
  category: 'ready-made' as 'ready-made' | 'fabric',
  subcategory: '',
  priceRupees: '',
  sizesCsv: '',
  stock: '',
}

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState(emptyForm)
  const [image, setImage] = useState<ProductImage | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const existing = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: adminApi.listProducts,
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit || !existing.data) return
    const product = existing.data.items.find((p) => p.id === id)
    if (!product) return
    setForm({
      name: product.name,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      priceRupees: String(product.price / 100),
      sizesCsv: product.sizes.join(', '),
      stock: String(product.stock),
    })
    setImage(product.images[0] ?? null)
  }, [isEdit, existing.data, id])

  const save = useMutation({
    mutationFn: (input: Partial<ProductInput>) =>
      isEdit ? adminApi.updateProduct(id!, input) : adminApi.createProduct(input as ProductInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      navigate('/admin/products')
    },
    onError: (err) => setError(err instanceof Error ? err.message : 'Save failed'),
  })

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const res = await adminApi.uploadProductImage(file)
      setImage(res.image)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const priceRupees = Number(form.priceRupees)
    const stock = Number(form.stock)
    if (!form.name.trim() || !form.description.trim() || !form.subcategory.trim()) {
      setError('Name, description, and subcategory are required.')
      return
    }
    if (!Number.isFinite(priceRupees) || priceRupees <= 0) {
      setError('Price must be a positive number of rupees.')
      return
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError('Stock must be zero or a positive whole number.')
      return
    }
    save.mutate({
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      subcategory: form.subcategory.trim().toLowerCase(),
      price: Math.round(priceRupees * 100),
      sizes: form.sizesCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      images: image ? [image] : [],
      stock,
      ...(isEdit ? {} : { active: true }),
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-display text-2xl text-primary">
          {isEdit ? 'Edit product' : 'New product'}
        </h3>
        <Link to="/admin/products" className="text-sm text-secondary hover:text-primary">
          Back to list
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-5 px-4 py-3 bg-destructive/10 text-destructive rounded text-sm">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Name"
          id="p-name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <div className="mb-5">
          <label htmlFor="p-desc" className="block text-sm font-medium text-primary mb-1.5">
            Description
          </label>
          <textarea
            id="p-desc"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-surface border border-border rounded text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="mb-5">
            <label htmlFor="p-cat" className="block text-sm font-medium text-primary mb-1.5">
              Category
            </label>
            <select
              id="p-cat"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value as 'ready-made' | 'fabric' })
              }
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="ready-made">Ready-made</option>
              <option value="fabric">Fabric</option>
            </select>
          </div>
          <TextField
            label="Subcategory"
            id="p-subcat"
            placeholder="kameez, cotton…"
            value={form.subcategory}
            onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <TextField
            label="Price (Rs)"
            id="p-price"
            type="number"
            min={1}
            value={form.priceRupees}
            onChange={(e) => setForm({ ...form, priceRupees: e.target.value })}
          />
          <TextField
            label="Stock"
            id="p-stock"
            type="number"
            min={0}
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <TextField
            label="Sizes (comma-sep)"
            id="p-sizes"
            placeholder="S, M, L"
            value={form.sizesCsv}
            onChange={(e) => setForm({ ...form, sizesCsv: e.target.value })}
          />
        </div>

        <div className="mb-8">
          <label htmlFor="p-image" className="block text-sm font-medium text-primary mb-1.5">
            Image {uploading && <span className="text-secondary">(uploading…)</span>}
          </label>
          {image && (
            <img
              src={image.url}
              alt="Product preview"
              width={96}
              height={120}
              className="w-24 h-30 object-cover rounded mb-3 border border-border"
            />
          )}
          <input
            id="p-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => handleFile(e.target.files?.[0])}
            className="block text-sm text-secondary file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-primary file:text-white file:cursor-pointer"
          />
        </div>

        <Button type="submit" loading={save.isPending || uploading}>
          {isEdit ? 'Save changes' : 'Create product'}
        </Button>
      </form>
    </div>
  )
}

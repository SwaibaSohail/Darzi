import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { adminApi } from './api'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'

export function ProductsAdminPage() {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: adminApi.listProducts,
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.updateProduct(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Link
          to="/admin/products/new"
          className="px-5 py-2 bg-primary text-white rounded text-sm transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          New product
        </Link>
      </div>

      {isPending && <Skeleton className="h-64 w-full" />}

      {data && (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-secondary">
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.images[0] ? (
                        <img
                          src={p.images[0].url}
                          alt=""
                          width={40}
                          height={50}
                          className="w-10 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-12 bg-muted rounded" aria-hidden="true" />
                      )}
                      <span className="font-medium text-primary">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {p.category} · {p.subcategory}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatPKR(p.price)}</td>
                  <td className="px-4 py-3 tabular-nums">{p.stock}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        p.active ? 'bg-green-100 text-green-800' : 'bg-muted text-secondary'
                      }`}
                    >
                      {p.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/products/${p.id}/edit`}
                      className="text-accent hover:underline mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive.mutate({ id: p.id, active: !p.active })}
                      disabled={toggleActive.isPending}
                      className="text-secondary hover:text-primary cursor-pointer disabled:opacity-50"
                    >
                      {p.active ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-secondary">
                    No products yet — create the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

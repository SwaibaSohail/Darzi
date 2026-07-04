import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { adminApi } from './api'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'

export function ServicesAdminPage() {
  const queryClient = useQueryClient()
  const { data, isPending } = useQuery({
    queryKey: ['admin', 'services'],
    queryFn: adminApi.listServices,
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      adminApi.updateService(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'services'] }),
  })

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Link
          to="/admin/services/new"
          className="px-5 py-2 bg-primary text-white rounded text-sm transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          New service
        </Link>
      </div>

      {isPending && <Skeleton className="h-48 w-full" />}

      {data && (
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-left text-secondary">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Base price</th>
                <th className="px-4 py-3 font-medium">Options</th>
                <th className="px-4 py-3 font-medium">Measurements</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-primary">{s.name}</td>
                  <td className="px-4 py-3 tabular-nums">{formatPKR(s.basePrice)}</td>
                  <td className="px-4 py-3 text-secondary">{s.options.length}</td>
                  <td className="px-4 py-3 text-secondary">{s.measurementFields.length} fields</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        s.active ? 'bg-green-100 text-green-800' : 'bg-muted text-secondary'
                      }`}
                    >
                      {s.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/admin/services/${s.id}/edit`}
                      className="text-accent hover:underline mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleActive.mutate({ id: s.id, active: !s.active })}
                      disabled={toggleActive.isPending}
                      className="text-secondary hover:text-primary cursor-pointer disabled:opacity-50"
                    >
                      {s.active ? 'Hide' : 'Show'}
                    </button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-secondary">
                    No services yet.
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

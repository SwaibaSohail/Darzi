import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useSocket } from '../../context/SocketContext'
import { ordersApi, STATUS_LABELS, STATUS_BADGE_CLASSES } from './api'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'

export function MyOrdersPage() {
  const { data, isPending } = useQuery({ queryKey: ['my-orders'], queryFn: ordersApi.listMine })
  const socket = useSocket()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!socket) return
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    socket.on('chat:unread', refresh)
    socket.on('order:status', refresh)
    return () => {
      socket.off('chat:unread', refresh)
      socket.off('order:status', refresh)
    }
  }, [socket, queryClient])

  return (
    <div>
      <h2 className="font-display text-4xl font-semibold text-primary mb-10">Your orders</h2>

      {isPending && <Skeleton className="h-40 w-full" />}

      {data && data.items.length === 0 && (
        <div className="text-center py-20">
          <p className="font-display text-2xl text-primary mb-2">No orders yet</p>
          <Link to="/products" className="text-accent hover:underline">
            Browse the collection
          </Link>
        </div>
      )}

      {data && data.items.length > 0 && (
        <ul className="space-y-4">
          {data.items.map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-4 border border-border rounded-lg px-6 py-4 bg-surface hover:shadow-md transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <div>
                  <p className="font-medium text-primary">{order.number}</p>
                  <p className="text-sm text-secondary">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  {(order.unread?.customer ?? 0) > 0 && (
                    <span
                      className="px-2 py-0.5 bg-accent text-white rounded-full text-xs font-medium"
                      aria-label={`${order.unread!.customer} unread messages`}
                    >
                      {order.unread!.customer} new
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[order.status]}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="font-semibold text-primary tabular-nums">
                    {formatPKR(order.amounts.total)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

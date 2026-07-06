import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '../../lib/api'
import { useSocket } from '../../context/SocketContext'
import {
  NEXT_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
  type Order,
  type OrderStatus,
} from '../orders/api'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'
import { ChatPanel } from '../chat/ChatPanel'

const FILTERS: (OrderStatus | 'all')[] = [
  'all',
  'placed',
  'confirmed',
  'cutting',
  'stitching',
  'ready',
  'delivered',
  'cancelled',
]

const adminOrdersApi = {
  list: (status: OrderStatus | 'all') =>
    apiFetch<{ items: Order[] }>(
      status === 'all' ? '/api/admin/orders' : `/api/admin/orders?status=${status}`,
    ),
  setStatus: (id: string, status: OrderStatus) =>
    apiFetch<{ order: Order }>(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  stats: () =>
    apiFetch<{
      stats: {
        totalOrders: number
        active: number
        byStatus: Record<OrderStatus, number>
        deliveredRevenue: number
        unreadChats: number
      }
    }>('/api/admin/stats'),
}

function StatsRow() {
  const { data } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminOrdersApi.stats })
  if (!data) return null
  const { stats } = data
  const cards = [
    { label: 'Active orders', value: String(stats.active), rule: 'bg-gold' },
    { label: 'Delivered', value: String(stats.byStatus.delivered), rule: 'bg-emerald-600' },
    { label: 'Revenue (delivered)', value: formatPKR(stats.deliveredRevenue), rule: 'bg-ink' },
    { label: 'Chats needing reply', value: String(stats.unreadChats), rule: 'bg-wine' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c) => (
        <div
          key={c.label}
          className="border border-border rounded-xl bg-surface p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
        >
          <div className={`w-8 h-1 rounded-full mb-3 ${c.rule}`} aria-hidden="true" />
          <p className="text-xs uppercase tracking-wide text-secondary mb-1">{c.label}</p>
          <p className="text-2xl font-semibold text-primary tabular-nums">{c.value}</p>
        </div>
      ))}
    </div>
  )
}

export function OrdersAdminPage() {
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const queryClient = useQueryClient()
  const socket = useSocket()

  const { data, isPending } = useQuery({
    queryKey: ['admin', 'orders', filter],
    queryFn: () => adminOrdersApi.list(filter),
  })

  useEffect(() => {
    if (!socket) return
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
    }
    socket.on('order:status', refresh)
    socket.on('chat:unread', refresh)
    return () => {
      socket.off('order:status', refresh)
      socket.off('chat:unread', refresh)
    }
  }, [socket, queryClient])

  const [openChat, setOpenChat] = useState<string | null>(null)

  const transition = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      adminOrdersApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  })

  return (
    <div>
      <StatsRow />
      <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="Filter orders by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-xs transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              filter === f
                ? 'bg-primary text-white'
                : 'bg-surface border border-border text-secondary hover:border-accent'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      {isPending && <Skeleton className="h-64 w-full" />}

      {data && data.items.length === 0 && (
        <p className="text-center py-16 text-secondary">No orders in this state.</p>
      )}

      {data && data.items.length > 0 && (
        <div className="space-y-4">
          {data.items.map((order) => (
            <article key={order.id} className="border border-border rounded-lg p-5 bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-primary">{order.number}</p>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE_CLASSES[order.status]}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                  {(order.unread?.admin ?? 0) > 0 && (
                    <span
                      className="px-2 py-0.5 bg-accent text-white rounded-full text-xs font-medium"
                      aria-label={`${order.unread!.admin} unread messages`}
                    >
                      {order.unread!.admin} new
                    </span>
                  )}
                </div>
                <p className="font-semibold text-primary tabular-nums">
                  {formatPKR(order.amounts.total)}
                </p>
              </div>

              <ul className="text-sm text-secondary mb-3">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.kind === 'product'
                      ? `${item.qty}× ${item.name}${item.size ? ` (${item.size})` : ''}`
                      : `Custom: ${item.serviceName}${item.fabric.source === 'shop' ? ` — ${item.fabric.name}` : ' — own fabric'}`}
                  </li>
                ))}
              </ul>

              {order.items.some((i) => i.kind === 'custom') && (
                <details className="mb-3 text-sm">
                  <summary className="cursor-pointer text-accent">Stitching details</summary>
                  {order.items
                    .filter((i) => i.kind === 'custom')
                    .map((item, idx) =>
                      item.kind === 'custom' ? (
                        <div key={idx} className="mt-2 pl-4 border-l-2 border-border text-secondary space-y-1">
                          <p className="font-medium text-primary">{item.serviceName}</p>
                          <p>
                            Measurements ({item.measurements.unit}):{' '}
                            {Object.entries(item.measurements.values)
                              .map(([k, v]) => `${k} ${v}`)
                              .join(', ')}
                          </p>
                          {item.optionSelections.length > 0 && (
                            <p>
                              {item.optionSelections
                                .map((s) => `${s.label}: ${s.choiceLabel}`)
                                .join(' · ')}
                            </p>
                          )}
                          {item.styleNotes && <p className="italic">"{item.styleNotes}"</p>}
                          {item.referenceImage && (
                            <a
                              href={item.referenceImage.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent hover:underline"
                            >
                              Reference image
                            </a>
                          )}
                        </div>
                      ) : null,
                    )}
                </details>
              )}

              <p className="text-xs text-secondary mb-4">
                {order.address.line1}, {order.address.city} · {order.address.phone}
              </p>

              <div className="flex flex-wrap gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => setOpenChat(openChat === order.id ? null : order.id)}
                  className="px-4 py-1.5 rounded text-sm border border-border text-secondary hover:border-accent hover:text-accent transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {openChat === order.id ? 'Close chat' : 'Chat'}
                </button>
              </div>

              {openChat === order.id && (
                <div className="my-4">
                  <ChatPanel orderId={order.id} compact />
                </div>
              )}

              {NEXT_STATUSES[order.status].length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {NEXT_STATUSES[order.status].map((next) => (
                    <button
                      key={next}
                      type="button"
                      disabled={transition.isPending}
                      onClick={() => {
                        if (next === 'cancelled' && !window.confirm('Cancel this order?')) return
                        transition.mutate({ id: order.id, status: next })
                      }}
                      className={`px-4 py-1.5 rounded text-sm transition-colors duration-150 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        next === 'cancelled'
                          ? 'border border-destructive text-destructive hover:bg-destructive/10'
                          : 'bg-primary text-white hover:bg-accent'
                      }`}
                    >
                      {next === 'cancelled' ? 'Cancel order' : `Mark ${STATUS_LABELS[next]}`}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

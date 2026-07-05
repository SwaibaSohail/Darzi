import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { useSocket } from '../../context/SocketContext'
import { ordersApi } from './api'
import { OrderStepper } from './OrderStepper'
import { formatPKR } from '../../lib/money'
import { Skeleton } from '../../components/Skeleton'
import { Button } from '../../components/Button'

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const socket = useSocket()

  // Live status: the stepper advances the moment the tailor updates the order.
  useEffect(() => {
    if (!socket || !id) return
    const onStatus = (payload: { orderId: string }) => {
      if (payload.orderId === id) {
        queryClient.invalidateQueries({ queryKey: ['order', id] })
        queryClient.invalidateQueries({ queryKey: ['my-orders'] })
      }
    }
    socket.on('order:status', onStatus)
    return () => {
      socket.off('order:status', onStatus)
    }
  }, [socket, id, queryClient])

  const { data, isPending, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id!),
    enabled: !!id,
  })

  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })

  if (isPending) return <Skeleton className="h-72 w-full" />

  if (isError || !data) {
    return (
      <div className="text-center py-20">
        <p className="font-display text-2xl text-primary mb-2">Order not found</p>
        <Link to="/orders" className="text-accent hover:underline">
          Back to orders
        </Link>
      </div>
    )
  }

  const { order } = data
  const cancellable = order.status === 'placed' || order.status === 'confirmed'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-3xl font-semibold text-primary">{order.number}</h2>
          <p className="text-sm text-secondary">Cash on delivery</p>
        </div>
        <Link to="/orders" className="text-sm text-secondary hover:text-primary">
          All orders
        </Link>
      </div>

      <section className="mb-10 overflow-x-auto">
        <OrderStepper status={order.status} />
      </section>

      <div className="grid md:grid-cols-[1fr_300px] gap-10">
        <section aria-label="Items">
          <ul className="divide-y divide-border">
            {order.items.map((item, i) =>
              item.kind === 'product' ? (
                <li key={i} className="py-4 flex gap-4">
                  {item.image ? (
                    <img src={item.image} alt="" width={56} height={70} className="w-14 h-[70px] object-cover rounded" />
                  ) : (
                    <div className="w-14 h-[70px] bg-muted rounded" aria-hidden="true" />
                  )}
                  <div className="flex-1 flex justify-between gap-4">
                    <div>
                      <p className="font-medium text-primary">{item.name}</p>
                      <p className="text-sm text-secondary">
                        {item.size ? `Size ${item.size} · ` : ''}Qty {item.qty}
                      </p>
                    </div>
                    <p className="tabular-nums text-primary">{formatPKR(item.unitPrice * item.qty)}</p>
                  </div>
                </li>
              ) : (
                <li key={i} className="py-4">
                  <div className="flex justify-between gap-4 mb-2">
                    <div>
                      <p className="font-medium text-primary">{item.serviceName}</p>
                      <p className="text-xs uppercase tracking-wide text-accent">Custom stitching</p>
                    </div>
                    <p className="tabular-nums text-primary">{formatPKR(item.lineTotal)}</p>
                  </div>
                  <div className="text-sm text-secondary space-y-1">
                    <p>
                      Fabric:{' '}
                      {item.fabric.source === 'shop'
                        ? `${item.fabric.name} (${formatPKR(item.fabric.price)})`
                        : 'Customer provides'}
                    </p>
                    {item.optionSelections.length > 0 && (
                      <p>
                        {item.optionSelections
                          .map((s) => `${s.label}: ${s.choiceLabel}`)
                          .join(' · ')}
                      </p>
                    )}
                    <p>
                      Measurements ({item.measurements.unit}):{' '}
                      {Object.entries(item.measurements.values)
                        .map(([k, v]) => `${k} ${v}`)
                        .join(', ')}
                    </p>
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
                </li>
              ),
            )}
          </ul>
        </section>

        <aside>
          <div className="border border-border rounded-lg p-5 bg-surface mb-5">
            <h3 className="font-medium text-primary mb-3">Amounts</h3>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-secondary">Subtotal</dt>
                <dd className="tabular-nums">{formatPKR(order.amounts.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Delivery</dt>
                <dd className="tabular-nums">
                  {order.amounts.delivery === 0 ? 'Free' : formatPKR(order.amounts.delivery)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold text-primary">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPKR(order.amounts.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="border border-border rounded-lg p-5 bg-surface mb-5">
            <h3 className="font-medium text-primary mb-2">Delivery to</h3>
            <p className="text-sm text-secondary leading-relaxed">
              {order.address.line1}
              <br />
              {order.address.city} {order.address.postal}
              <br />
              {order.address.phone}
            </p>
          </div>

          {cancellable && (
            <Button
              type="button"
              variant="outline"
              loading={cancel.isPending}
              onClick={() => {
                if (window.confirm('Cancel this order?')) cancel.mutate()
              }}
            >
              Cancel order
            </Button>
          )}
        </aside>
      </div>
    </div>
  )
}

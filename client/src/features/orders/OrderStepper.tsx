import { ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from './api'

export function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === 'cancelled') {
    return (
      <p className="px-4 py-3 bg-red-50 text-red-700 rounded text-sm font-medium" role="status">
        This order was cancelled.
      </p>
    )
  }

  const currentIndex = ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number])

  return (
    <ol className="flex flex-wrap gap-y-4" aria-label="Order progress">
      {ORDER_STATUSES.map((s, i) => {
        const done = i < currentIndex
        const current = i === currentIndex
        return (
          <li key={s} className="flex items-center">
            <div className="flex flex-col items-center min-w-16">
              <span
                aria-hidden="true"
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors duration-300 ${
                  done
                    ? 'bg-accent border-accent text-white'
                    : current
                      ? 'border-accent text-accent bg-surface'
                      : 'border-border text-secondary bg-surface'
                }`}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={`mt-1.5 text-xs ${current ? 'text-primary font-semibold' : 'text-secondary'}`}
                aria-current={current ? 'step' : undefined}
              >
                {STATUS_LABELS[s]}
              </span>
            </div>
            {i < ORDER_STATUSES.length - 1 && (
              <span
                aria-hidden="true"
                className={`w-6 sm:w-10 h-0.5 mb-5 ${done ? 'bg-accent' : 'bg-border'}`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

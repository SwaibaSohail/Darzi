const formatter = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
})

/** Formats integer paisa (PKR minor unit) for display, e.g. 450000 -> "Rs 4,500" */
export function formatPKR(paisa: number): string {
  return formatter.format(paisa / 100)
}

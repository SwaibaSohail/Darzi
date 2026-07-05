import type { StitchingService } from './api'

/**
 * Client-side estimate for display in the wizard and cart.
 * The server recomputes everything at checkout — this is never trusted.
 */
export function computeEstimate(
  service: StitchingService,
  selections: Record<string, string>,
  fabricPrice: number,
): number {
  let total = service.basePrice + fabricPrice
  for (const option of service.options) {
    const picked = selections[option.key]
    const choice = option.choices.find((c) => c.value === picked)
    if (choice) total += choice.priceDelta
  }
  return total
}

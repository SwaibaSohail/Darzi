import { describe, it, expect } from 'vitest'
import { formatPKR } from './money'

describe('formatPKR', () => {
  it('formats paisa as whole rupees', () => {
    expect(formatPKR(450000)).toMatch(/4,500/)
  })

  it('shows the PKR currency marker', () => {
    expect(formatPKR(450000)).toMatch(/Rs|PKR/)
  })

  it('never shows decimals', () => {
    expect(formatPKR(123456)).not.toMatch(/\./)
  })

  it('handles zero', () => {
    expect(formatPKR(0)).toMatch(/0/)
  })
})

import { describe, it, expect } from 'vitest'
import { computeEstimate } from './estimate'
import type { StitchingService } from './api'

const service: StitchingService = {
  id: 's1',
  name: 'Shalwar Kameez',
  description: 'd',
  basePrice: 250000,
  options: [
    {
      key: 'collar',
      label: 'Collar',
      choices: [
        { value: 'ban', label: 'Ban', priceDelta: 0 },
        { value: 'round', label: 'Round', priceDelta: 5000 },
      ],
    },
    {
      key: 'cuff',
      label: 'Cuff',
      choices: [
        { value: 'plain', label: 'Plain', priceDelta: 0 },
        { value: 'button', label: 'Button', priceDelta: 10000 },
      ],
    },
  ],
  measurementFields: ['chest'],
  image: null,
}

describe('computeEstimate', () => {
  it('starts at base price with no selections or fabric', () => {
    expect(computeEstimate(service, {}, 0)).toBe(250000)
  })

  it('adds selected option deltas', () => {
    expect(computeEstimate(service, { collar: 'round', cuff: 'button' }, 0)).toBe(265000)
  })

  it('adds fabric price', () => {
    expect(computeEstimate(service, { collar: 'ban' }, 350000)).toBe(600000)
  })

  it('ignores unknown selections', () => {
    expect(computeEstimate(service, { collar: 'hacked' }, 0)).toBe(250000)
  })
})

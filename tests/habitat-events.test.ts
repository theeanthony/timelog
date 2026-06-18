import { describe, expect, it } from 'vitest'
import { HABITATS } from '../src/shared/species'
import { HABITAT_EVENTS, habitatEvent } from '../src/shared/habitat-events'

const VALID = new Set([
  'lamp',
  'leaffall',
  'gust',
  'heat',
  'ripple',
  'aurora',
  'wave',
  'shoot',
  'flicker',
  'cryspulse',
  'erupt'
])

describe('habitat events', () => {
  it('maps every habitat to a valid environment event', () => {
    for (const h of HABITATS) {
      expect(VALID.has(habitatEvent(h))).toBe(true)
    }
  })

  it('covers exactly the habitat set', () => {
    expect(Object.keys(HABITAT_EVENTS).sort()).toEqual([...HABITATS].sort())
  })
})

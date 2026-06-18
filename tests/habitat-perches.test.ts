import { describe, expect, it } from 'vitest'
import { HABITAT_PERCHES, habitatPerches } from '../src/shared/habitat-perches'
import { HABITATS } from '../src/shared/species'

describe('habitat perches', () => {
  it('defines at least one perchable spot for every habitat', () => {
    for (const h of HABITATS) {
      expect(habitatPerches(h).length).toBeGreaterThan(0)
    }
  })

  it('keeps every zone inside the 320×480 scene viewBox', () => {
    for (const h of HABITATS) {
      for (const z of HABITAT_PERCHES[h]) {
        expect(z.x).toBeGreaterThanOrEqual(0)
        expect(z.y).toBeGreaterThanOrEqual(0)
        expect(z.x + z.w).toBeLessThanOrEqual(320)
        expect(z.y + z.h).toBeLessThanOrEqual(480)
      }
    }
  })

  it('sizes every zone big enough to clear the scanner threshold (w≥18, h≥9)', () => {
    for (const h of HABITATS) {
      for (const z of HABITAT_PERCHES[h]) {
        expect(z.w).toBeGreaterThanOrEqual(18)
        expect(z.h).toBeGreaterThanOrEqual(9)
        expect(z.on).toBeTruthy()
      }
    }
  })

  it('keeps perches in the central band so they survive panel + Zoo crops', () => {
    for (const h of HABITATS) {
      for (const z of HABITAT_PERCHES[h]) {
        expect(z.y).toBeGreaterThanOrEqual(90)
        expect(z.y).toBeLessThanOrEqual(410)
      }
    }
  })
})

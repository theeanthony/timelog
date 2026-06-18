import { describe, expect, it } from 'vitest'
import { tintForHour, phaseForHour } from '../src/shared/daynight'

describe('day/night tint', () => {
  it('classifies the phases of the day', () => {
    expect(phaseForHour(2)).toBe('night')
    expect(phaseForHour(6)).toBe('dawn')
    expect(phaseForHour(13)).toBe('day')
    expect(phaseForHour(19)).toBe('dusk')
    expect(phaseForHour(23)).toBe('night')
  })

  it('midday is clear and night is darkest', () => {
    expect(tintForHour(13).opacity).toBe(0)
    expect(tintForHour(0).opacity).toBeGreaterThan(0.5)
    expect(tintForHour(13).opacity).toBeLessThan(tintForHour(0).opacity)
  })

  it('returns a CSS rgb colour and wraps the hour', () => {
    expect(tintForHour(3).color).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
    expect(tintForHour(24)).toEqual(tintForHour(0))
    expect(tintForHour(-1)).toEqual(tintForHour(23))
  })

  it('interpolates smoothly between anchors', () => {
    // 11:00 sits between the 09:00 and 13:00 anchors → opacity strictly between.
    const o = tintForHour(11).opacity
    expect(o).toBeGreaterThan(0)
    expect(o).toBeLessThan(0.06)
  })
})

import { describe, expect, it } from 'vitest'
import { moodForState } from '../src/shared/pet-mood'

const LONG = 4 * 3_600_000 // 4h
const FOCUS = 25 * 60_000 // 25m

describe('pet mood mapping', () => {
  it('sleeps when idle, locked, or checked out', () => {
    expect(moodForState('idle', 0, LONG, FOCUS)).toBe('sleep')
    expect(moodForState('locked', 0, LONG, FOCUS)).toBe('sleep')
    expect(moodForState('checked_out', 0, LONG, FOCUS)).toBe('sleep')
  })

  it('is confused when nothing matches / permission missing', () => {
    expect(moodForState('no_match', 0, LONG, FOCUS)).toBe('confused')
    expect(moodForState('permission_needed', 0, LONG, FOCUS)).toBe('confused')
  })

  it('escalates while tracking: idle → focused → tired', () => {
    expect(moodForState('tracking', 60_000, LONG, FOCUS)).toBe('idle')
    expect(moodForState('tracking', FOCUS, LONG, FOCUS)).toBe('focused')
    expect(moodForState('tracking', LONG, LONG, FOCUS)).toBe('tired')
  })
})

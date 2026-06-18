import { describe, expect, it } from 'vitest'
import { HABITATS } from '../src/shared/species'
import {
  HABITAT_ACTIVITIES,
  PROP_SVG,
  anchorTarget,
  habitatActivities,
  spotEligible,
  type ActivitySpot
} from '../src/shared/habitat-activities'

const PERFORM_ACTS = new Set([
  'climb',
  'swing',
  'surf',
  'bask',
  'nap',
  'drink',
  'dig',
  'splash',
  'bounce',
  'glow',
  'gaze',
  'hang',
  'perch',
  'slide'
])
const ANCHORS = new Set(['on', 'ontop', 'onwave', 'under', 'beside', 'hang', 'swing', 'climb'])
const MOODS = new Set([
  'idle',
  'focused',
  'happy',
  'celebrate',
  'sleep',
  'confused',
  'tired',
  'love',
  'surprised',
  'playful'
])

describe('habitat activities', () => {
  it('gives every habitat at least one activity spot', () => {
    for (const h of HABITATS) {
      expect(habitatActivities(h).length).toBeGreaterThan(0)
    }
  })

  it('every spot is well-formed and references real prop art', () => {
    for (const h of HABITATS) {
      for (const s of HABITAT_ACTIVITIES[h]) {
        expect(s.fx).toBeGreaterThanOrEqual(0)
        expect(s.fx).toBeLessThanOrEqual(1)
        expect(s.fy).toBeGreaterThanOrEqual(0)
        expect(s.fy).toBeLessThanOrEqual(1)
        expect(PROP_SVG[s.prop]).toBeDefined()
        expect(PERFORM_ACTS.has(s.pa)).toBe(true)
        expect(ANCHORS.has(s.anchor)).toBe(true)
        expect(MOODS.has(s.mood)).toBe(true)
        expect(s.label).toBeTruthy()
        expect(s.svg.startsWith('<svg')).toBe(true)
        expect(s.svg.endsWith('</svg>')).toBe(true)
        expect(s.w).toBe(PROP_SVG[s.prop].w)
        expect(s.h).toBe(PROP_SVG[s.prop].h)
      }
    }
  })

  it('every prop art string is valid SVG', () => {
    for (const name of Object.keys(PROP_SVG)) {
      const p = PROP_SVG[name as keyof typeof PROP_SVG]
      expect(p.svg.startsWith('<svg')).toBe(true)
      expect(p.w).toBeGreaterThan(0)
      expect(p.h).toBeGreaterThan(0)
    }
  })

  it('eligibility accepts "any" and explicit loco lists', () => {
    const anySpot = { eligible: 'any' } as ActivitySpot
    expect(spotEligible(anySpot, 'walk')).toBe(true)
    expect(spotEligible(anySpot, 'fly')).toBe(true)
    const walkOnly = { eligible: ['walk'] } as ActivitySpot
    expect(spotEligible(walkOnly, 'walk')).toBe(true)
    expect(spotEligible(walkOnly, 'fly')).toBe(false)
  })

  it('anchorTarget lands a pet inside the stage for every spot', () => {
    const W = 300
    const H = 140
    const S = 48
    for (const h of HABITATS) {
      for (const s of HABITAT_ACTIVITIES[h]) {
        const t = anchorTarget(s, S, W, H, 0.5)
        expect(t.x).toBeGreaterThan(-S)
        expect(t.x).toBeLessThan(W)
        expect(t.y).toBeGreaterThan(-S)
        expect(t.y).toBeLessThan(H)
      }
    }
  })
})

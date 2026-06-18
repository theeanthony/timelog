import { describe, expect, it } from 'vitest'
import {
  rollSprite,
  rollMany,
  rngFromSeed,
  rarityRank,
  RARITY_ORDER,
  RARITY_WEIGHTS
} from '../src/shared/sprite-gen'
import { SPECIES, SPECIES_IDS } from '../src/shared/species'
import type { Rarity } from '../src/shared/types'

const HEX = /^#[0-9a-f]{6}$/

describe('variant engine', () => {
  it('is deterministic — same seed yields an identical critter', () => {
    expect(rollSprite('alpha')).toEqual(rollSprite('alpha'))
    expect(rollSprite('alpha')).not.toEqual(rollSprite('beta'))
  })

  it('produces well-formed variants', () => {
    for (let i = 0; i < 200; i++) {
      const v = rollSprite(`seed-${i}`)
      expect(SPECIES_IDS).toContain(v.species)
      expect(RARITY_ORDER).toContain(v.rarity)
      expect(v.palette.body).toMatch(HEX)
      expect(v.palette.accent).toMatch(HEX)
      expect(v.palette.eye).toMatch(HEX)
      // habitat always matches the rolled species' habitat
      const sp = SPECIES.find((s) => s.id === v.species)
      expect(v.habitat).toBe(sp?.habitat)
      if (v.pattern) expect(['spots', 'stripes', 'patch']).toContain(v.pattern)
      if (v.accessory) expect(['scarf', 'cap', 'glasses']).toContain(v.accessory)
      expect(v.seed).toBe(`seed-${i}`)
    }
  })

  it('respects a habitat constraint', () => {
    for (let i = 0; i < 100; i++) {
      const v = rollSprite(`h-${i}`, { habitat: 'forest' })
      expect(v.habitat).toBe('forest')
      const sp = SPECIES.find((s) => s.id === v.species)
      expect(sp?.habitat).toBe('forest')
    }
  })

  it('respects a species pool constraint', () => {
    for (let i = 0; i < 50; i++) {
      const v = rollSprite(`p-${i}`, { pool: ['cat'] })
      expect(v.species).toBe('cat')
    }
  })

  it('falls back to the full catalog for an empty habitat', () => {
    // ocean has no species yet → should still return a valid critter
    const v = rollSprite('ocean-1', { habitat: 'ocean' })
    expect(SPECIES_IDS).toContain(v.species)
  })

  it('rollMany returns n critters with derived, distinct seeds', () => {
    const many = rollMany('batch', 5)
    expect(many).toHaveLength(5)
    expect(new Set(many.map((m) => m.seed)).size).toBe(5)
    expect(many[0].seed).toBe('batch:0')
  })

  it('rarity distribution roughly tracks the weights', () => {
    const counts: Record<Rarity, number> = {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0
    }
    const N = 4000
    for (let i = 0; i < N; i++) counts[rollSprite(`d-${i}`).rarity]++
    // common is by far the most frequent; legendary the least.
    expect(counts.common).toBeGreaterThan(counts.uncommon)
    expect(counts.uncommon).toBeGreaterThan(counts.legendary)
    expect(counts.legendary).toBeLessThan(counts.common)
    // sanity: common share is in the right ballpark (~60%)
    expect(counts.common / N).toBeGreaterThan(0.45)
    expect(counts.common / N).toBeLessThan(0.75)
  })

  it('rngFromSeed is a deterministic 0→1 stream', () => {
    const a = rngFromSeed('x')
    const b = rngFromSeed('x')
    for (let i = 0; i < 20; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('exposes rarity ranking + weights', () => {
    expect(rarityRank('common')).toBeLessThan(rarityRank('legendary'))
    expect(RARITY_WEIGHTS.common).toBeGreaterThan(RARITY_WEIGHTS.legendary)
  })
})

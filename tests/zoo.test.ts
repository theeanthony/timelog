import { describe, expect, it } from 'vitest'
import {
  eggsEarned,
  hatchEgg,
  hatchUpTo,
  unlockProgress,
  mergeCollection,
  groupByHabitat,
  rarityCounts,
  sortByRarity,
  MS_PER_EGG,
  STARTER_EGGS
} from '../src/shared/zoo'
import { HABITATS } from '../src/shared/species'
import { rarityRank } from '../src/shared/sprite-gen'
import type { SpriteVariant } from '../src/shared/types'

describe('zoo earn + collection logic', () => {
  it('grants starters then one critter per hour, monotonically', () => {
    expect(eggsEarned(0)).toBe(STARTER_EGGS)
    expect(eggsEarned(MS_PER_EGG - 1)).toBe(STARTER_EGGS)
    expect(eggsEarned(MS_PER_EGG)).toBe(STARTER_EGGS + 1)
    expect(eggsEarned(10 * MS_PER_EGG)).toBe(STARTER_EGGS + 10)
    expect(eggsEarned(-5)).toBe(STARTER_EGGS)
  })

  it('hatches deterministically from salt + index', () => {
    expect(hatchEgg('salt', 4)).toEqual(hatchEgg('salt', 4))
    expect(hatchEgg('salt', 4)).not.toEqual(hatchEgg('salt', 5))
    expect(hatchEgg('a', 0)).not.toEqual(hatchEgg('b', 0))
  })

  it('hatchUpTo returns the right count and is a deterministic prefix', () => {
    const five = hatchUpTo('s', 5)
    const three = hatchUpTo('s', 3)
    expect(five).toHaveLength(5)
    expect(hatchUpTo('s', 0)).toHaveLength(0)
    // the first 3 of 5 equal hatchUpTo(3) — growth only appends
    expect(five.slice(0, 3)).toEqual(three)
  })

  it('reports progress toward the next critter', () => {
    const p = unlockProgress(MS_PER_EGG / 4)
    expect(p.fractionToNext).toBeCloseTo(0.25, 5)
    expect(p.msToNext).toBe(MS_PER_EGG * 0.75)
    expect(p.earned).toBe(STARTER_EGGS)
    expect(unlockProgress(0).fractionToNext).toBe(0)
    const p2 = unlockProgress(2 * MS_PER_EGG + MS_PER_EGG / 2)
    expect(p2.earned).toBe(STARTER_EGGS + 2)
    expect(p2.fractionToNext).toBeCloseTo(0.5, 5)
  })

  it('merges collections deduped by seed, first wins', () => {
    const a: SpriteVariant = { ...hatchEgg('x', 0), seed: 'dup' }
    const b: SpriteVariant = { ...hatchEgg('x', 1), seed: 'dup' }
    const c = hatchEgg('x', 2)
    const merged = mergeCollection([a], [b, c])
    expect(merged).toHaveLength(2)
    expect(merged.find((v) => v.seed === 'dup')).toBe(a)
  })

  it('groups by every habitat in order, sorted rarest-first', () => {
    const groups = groupByHabitat(hatchUpTo('z', 40))
    expect(groups.map((g) => g.habitat)).toEqual(HABITATS)
    for (const g of groups) {
      for (let i = 1; i < g.items.length; i++) {
        expect(rarityRank(g.items[i - 1].rarity)).toBeGreaterThanOrEqual(
          rarityRank(g.items[i].rarity)
        )
      }
    }
  })

  it('counts rarities to the collection size', () => {
    const col = hatchUpTo('c', 50)
    const counts = rarityCounts(col)
    const total = Object.values(counts).reduce((a, b) => a + b, 0)
    expect(total).toBe(50)
  })

  it('sorts rarest-first without mutating the input', () => {
    const col = hatchUpTo('m', 12)
    const sorted = sortByRarity(col)
    expect(sorted).toHaveLength(col.length)
    expect(col).not.toBe(sorted)
    for (let i = 1; i < sorted.length; i++) {
      expect(rarityRank(sorted[i - 1].rarity)).toBeGreaterThanOrEqual(rarityRank(sorted[i].rarity))
    }
  })
})

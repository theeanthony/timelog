/**
 * Zoo logic — the "light unlocking" layer over the variant engine.
 *
 * Critters are *earned* from cumulative tracked time: a few starters up front,
 * then one more per hour logged. Because hatching is deterministic from the
 * install salt + egg index, the earned collection is a pure function of
 * (salt, tracked-ms) — no per-critter persistence needed. Imported/traded
 * critters (Phase 5) are merged on top by seed.
 *
 * Pure + DOM-free so it can be unit-tested.
 */
import type { Habitat, Rarity, SpriteVariant } from './types'
import { rollSprite, rarityRank } from './sprite-gen'
import { HABITATS } from './species'

/** Tracked time that earns one new critter. */
export const MS_PER_EGG = 60 * 60 * 1000 // 1 hour
/** Critters granted before any tracking, so the zoo is never empty. */
export const STARTER_EGGS = 3

/** How many critters cumulative tracked time has earned (incl. starters). */
export function eggsEarned(
  lifetimeMs: number,
  msPerEgg = MS_PER_EGG,
  starters = STARTER_EGGS
): number {
  return starters + Math.floor(Math.max(0, lifetimeMs) / msPerEgg)
}

/** Deterministically hatch the i-th egg for an install salt. */
export function hatchEgg(salt: string, index: number): SpriteVariant {
  return rollSprite(`${salt}:${index}`)
}

/** The earned collection for (salt, count): eggs 0 … count-1. */
export function hatchUpTo(salt: string, count: number): SpriteVariant[] {
  const out: SpriteVariant[] = []
  for (let i = 0; i < Math.max(0, count); i++) out.push(hatchEgg(salt, i))
  return out
}

export interface UnlockProgress {
  /** Total critters earned (incl. starters). */
  earned: number
  /** Tracked-ms remaining until the next critter. */
  msToNext: number
  /** Progress toward the next critter, 0 → 1. */
  fractionToNext: number
}

export function unlockProgress(
  lifetimeMs: number,
  msPerEgg = MS_PER_EGG,
  starters = STARTER_EGGS
): UnlockProgress {
  const ms = Math.max(0, lifetimeMs)
  const beyond = ms % msPerEgg
  return {
    earned: starters + Math.floor(ms / msPerEgg),
    msToNext: msPerEgg - beyond,
    fractionToNext: beyond / msPerEgg
  }
}

/** Merge several critter lists, keeping the first occurrence of each seed. */
export function mergeCollection(...lists: SpriteVariant[][]): SpriteVariant[] {
  const bySeed = new Map<string, SpriteVariant>()
  for (const list of lists) {
    for (const v of list) if (!bySeed.has(v.seed)) bySeed.set(v.seed, v)
  }
  return [...bySeed.values()]
}

/** Group a collection by habitat in display order (all habitats included). */
export function groupByHabitat(
  collection: SpriteVariant[]
): { habitat: Habitat; items: SpriteVariant[] }[] {
  return HABITATS.map((habitat) => ({
    habitat,
    items: sortByRarity(collection.filter((v) => v.habitat === habitat))
  }))
}

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

/** Count critters per rarity tier. */
export function rarityCounts(collection: SpriteVariant[]): Record<Rarity, number> {
  const counts: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0
  }
  for (const v of collection) counts[v.rarity]++
  return counts
}

/** Sort a collection rarest-first, then by species, then seed (stable). */
export function sortByRarity(collection: SpriteVariant[]): SpriteVariant[] {
  return [...collection].sort(
    (a, b) =>
      rarityRank(b.rarity) - rarityRank(a.rarity) ||
      a.species.localeCompare(b.species) ||
      a.seed.localeCompare(b.seed)
  )
}

export { RARITIES }

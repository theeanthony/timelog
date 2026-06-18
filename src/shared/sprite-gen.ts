/**
 * The variant engine — turns a seed string into a collectible critter.
 *
 * The core idea: a sprite is *data, not a file*. A small roster of hand-drawn
 * species (see `species.ts`) combined with generated palette / pattern /
 * accessory / shiny traits yields thousands of distinct collectibles. Rolls are
 * fully deterministic from their `seed` (no Math.random), so the same seed
 * always yields the same critter — which is what makes trade codes and a
 * persisted collection stable. Pure + DOM-free so it can be unit-tested.
 */
import type { Habitat, Rarity, SpriteAccessory, SpritePattern, SpriteVariant } from './types'
import { SPECIES, type Species } from './species'

/** Drop weights per rarity tier (relative; need not sum to 100). */
export const RARITY_WEIGHTS: Record<Rarity, number> = {
  common: 60,
  uncommon: 25,
  rare: 10,
  epic: 4,
  legendary: 1
}

/** Rarity tiers from most to least common. */
export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

const RARITY_RANK: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4
}

/** Higher rarity → higher chance of a coat pattern. */
const PATTERN_CHANCE: Record<Rarity, number> = {
  common: 0.15,
  uncommon: 0.3,
  rare: 0.45,
  epic: 0.6,
  legendary: 0.85
}

/** Higher rarity → higher chance of an accessory. */
const ACCESSORY_CHANCE: Record<Rarity, number> = {
  common: 0.05,
  uncommon: 0.12,
  rare: 0.25,
  epic: 0.45,
  legendary: 0.7
}

/** Higher rarity → higher chance of a shiny treatment. */
const SHINY_CHANCE: Record<Rarity, number> = {
  common: 0.02,
  uncommon: 0.03,
  rare: 0.05,
  epic: 0.12,
  legendary: 0.3
}

const PATTERNS: SpritePattern[] = ['spots', 'stripes', 'patch']
const ACCESSORIES: SpriteAccessory[] = ['scarf', 'cap', 'glasses']

export interface RollOptions {
  /** Restrict the species pool to one habitat. */
  habitat?: Habitat
  /** Restrict the species pool to these ids. */
  pool?: string[]
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)

// ── deterministic PRNG (xmur3 seed → mulberry32 stream) ──────────────────────

function xmur3(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A deterministic 0→1 random stream for a seed string. */
export function rngFromSeed(seed: string): () => number {
  return mulberry32(xmur3(seed))
}

// ── colour helpers ───────────────────────────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100
  const ln = l / 100
  const k = (n: number): number => (n + h / 30) % 12
  const a = sn * Math.min(ln, 1 - ln)
  const f = (n: number): string => {
    const c = ln - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

// ── picking ──────────────────────────────────────────────────────────────────

function weightedPick<T>(rng: () => number, items: T[], weight: (t: T) => number): T {
  const total = items.reduce((sum, it) => sum + weight(it), 0)
  let r = rng() * total
  for (const it of items) {
    r -= weight(it)
    if (r <= 0) return it
  }
  return items[items.length - 1]
}

function pickRarity(rng: () => number): Rarity {
  return weightedPick(rng, RARITY_ORDER, (r) => RARITY_WEIGHTS[r])
}

function rollPalette(
  rng: () => number,
  rarity: Rarity,
  shiny: boolean
): { body: string; accent: string; eye: string } {
  const boost = RARITY_RANK[rarity]
  const hue = Math.floor(rng() * 360)
  const sat = clamp(46 + boost * 9 + Math.floor(rng() * 24) + (shiny ? 12 : 0), 38, 96)
  const light = clamp(60 + Math.floor(rng() * 16) - boost * 3, 38, 80)
  const body = hslToHex(hue, sat, light)
  const accentHue = (hue + 150 + Math.floor(rng() * 70)) % 360
  const accent = hslToHex(accentHue, clamp(sat + 12, 40, 98), clamp(light + 6, 42, 84))
  // Shiny criters get a glowing iris; everyone else keeps the near-black eye.
  const eye = shiny ? hslToHex((accentHue + 30) % 360, 90, 45) : '#14131a'
  return { body, accent, eye }
}

/**
 * Roll a deterministic collectible from `seed`. Same seed → identical critter.
 * Pass `opts.habitat` / `opts.pool` to constrain which species can appear.
 */
export function rollSprite(seed: string, opts: RollOptions = {}): SpriteVariant {
  const rng = rngFromSeed(seed)

  const rarity = pickRarity(rng)

  let pool: Species[] = SPECIES
  if (opts.habitat) pool = pool.filter((s) => s.habitat === opts.habitat)
  if (opts.pool) {
    const ids = opts.pool
    pool = pool.filter((s) => ids.includes(s.id))
  }
  if (pool.length === 0) pool = SPECIES
  const species = weightedPick(rng, pool, (s) => s.weight)

  const shiny = rng() < SHINY_CHANCE[rarity]
  const palette = rollPalette(rng, rarity, shiny)
  const pattern =
    rng() < PATTERN_CHANCE[rarity] ? PATTERNS[Math.floor(rng() * PATTERNS.length)] : undefined
  const accessory =
    rng() < ACCESSORY_CHANCE[rarity]
      ? ACCESSORIES[Math.floor(rng() * ACCESSORIES.length)]
      : undefined

  return {
    species: species.id,
    habitat: species.habitat,
    palette,
    pattern,
    accessory,
    shiny: shiny || undefined,
    rarity,
    seed
  }
}

/** Roll `n` distinct critters from a base seed (`base:0`, `base:1`, …). */
export function rollMany(baseSeed: string, n: number, opts: RollOptions = {}): SpriteVariant[] {
  const out: SpriteVariant[] = []
  for (let i = 0; i < n; i++) out.push(rollSprite(`${baseSeed}:${i}`, opts))
  return out
}

/** Sort key for rarity (0 = common … 4 = legendary). */
export function rarityRank(r: Rarity): number {
  return RARITY_RANK[r]
}

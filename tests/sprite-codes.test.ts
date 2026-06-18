import { describe, expect, it } from 'vitest'
import { encodeVariant, decodeVariant, isValidCode } from '../src/shared/sprite-codes'
import { rollSprite } from '../src/shared/sprite-gen'
import type { SpriteVariant } from '../src/shared/types'

const sample: SpriteVariant = {
  species: 'fox',
  habitat: 'forest',
  palette: { body: '#aabbcc', accent: '#112233', eye: '#14131a' },
  pattern: 'stripes',
  accessory: 'scarf',
  shiny: true,
  rarity: 'legendary',
  seed: 'install-uuid:42'
}

describe('trade codes', () => {
  it('round-trips a fully-featured critter', () => {
    expect(decodeVariant(encodeVariant(sample))).toEqual(sample)
  })

  it('round-trips plain critters (no pattern/accessory/shiny)', () => {
    for (let i = 0; i < 100; i++) {
      const v = rollSprite(`code-${i}`)
      expect(decodeVariant(encodeVariant(v))).toEqual(v)
    }
  })

  it('is deterministic and copy/paste safe', () => {
    const code = encodeVariant(sample)
    expect(encodeVariant(sample)).toBe(code)
    expect(code).toMatch(/^[A-Za-z0-9_.-]+$/) // no spaces / URL-safe
  })

  it('rejects garbage, empty, and codes without a checksum', () => {
    expect(decodeVariant('')).toBeNull()
    expect(decodeVariant('not a code')).toBeNull()
    expect(decodeVariant('deadbeef')).toBeNull() // no dot
    expect(isValidCode('????.zzzz')).toBe(false)
  })

  it('rejects a tampered code (checksum mismatch)', () => {
    const code = encodeVariant(sample)
    const flipped = (code[0] === 'A' ? 'B' : 'A') + code.slice(1)
    expect(decodeVariant(flipped)).toBeNull()
  })

  it('preserves an unknown future species (habitat carried in the code)', () => {
    const future: SpriteVariant = { ...sample, species: 'dragon', habitat: 'sky' }
    const back = decodeVariant(encodeVariant(future))
    expect(back?.species).toBe('dragon')
    expect(back?.habitat).toBe('sky')
  })
})

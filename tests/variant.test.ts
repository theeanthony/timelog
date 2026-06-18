import { describe, expect, it } from 'vitest'
import {
  composeVariantSvg,
  variantCssVars,
  variantClassName,
  RARITY_LABEL,
  RARITY_COLOR
} from '../src/shared/variant'
import type { SpriteVariant } from '../src/shared/types'

const base = (over: Partial<SpriteVariant> = {}): SpriteVariant => ({
  species: 'cat',
  habitat: 'home',
  palette: { body: '#abcdef', accent: '#123456', eye: '#000000' },
  rarity: 'common',
  seed: 'test',
  ...over
})

const SVG = '<svg viewBox="0 0 64 64"><g id="body"></g></svg>'

describe('variant rendering', () => {
  it('returns the species SVG unchanged when there are no overlays', () => {
    expect(composeVariantSvg(SVG, base())).toBe(SVG)
  })

  it('injects pattern + accessory overlays before the closing tag', () => {
    const out = composeVariantSvg(SVG, base({ pattern: 'spots', accessory: 'scarf' }))
    expect(out).toContain('ov-spots')
    expect(out).toContain('ov-scarf')
    expect(out.endsWith('</svg>')).toBe(true)
    // overlays come after the body, before </svg>
    expect(out.indexOf('id="body"')).toBeLessThan(out.indexOf('ov-spots'))
    expect(out.indexOf('ov-spots')).toBeLessThan(out.indexOf('</svg>'))
  })

  it('maps the palette to inline CSS vars', () => {
    const v = variantCssVars(base())
    expect(v.color).toBe('#abcdef')
    expect(v['--pet-accent']).toBe('#123456')
    expect(v['--pet-eye']).toBe('#000000')
  })

  it('adds the shiny class only for shiny variants', () => {
    expect(variantClassName(base())).toBe('pet')
    expect(variantClassName(base({ shiny: true }))).toBe('pet pet--shiny')
  })

  it('exposes a label + colour for every rarity', () => {
    for (const r of ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const) {
      expect(RARITY_LABEL[r]).toBeTruthy()
      expect(RARITY_COLOR[r]).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

/**
 * Turns a `SpriteVariant` recipe into rendered ingredients: the three colour
 * CSS vars, optional pattern/accessory overlay markup composed onto a species'
 * SVG, and small presentation helpers (rarity labels/colours) for the Zoo.
 *
 * Kept pure + asset-free (the caller supplies the species SVG string) so it can
 * be unit-tested in the node environment. The renderer wraps this with the
 * registry to resolve a species' markup.
 */
import type { Rarity, SpriteAccessory, SpritePattern, SpriteVariant } from './types'

/**
 * Overlay layers drawn on top of the body. Coordinates target the shared
 * 64×64 viewBox over the central body mass; they use the same themeable
 * channels (`currentColor` / `--pet-accent` / `--pet-eye`) as the species art.
 */
export const PATTERN_SVG: Record<SpritePattern, string> = {
  spots:
    '<g class="ov ov-spots" fill="var(--pet-eye)" opacity="0.18">' +
    '<circle cx="26" cy="44" r="2.6"></circle>' +
    '<circle cx="33" cy="49" r="2"></circle>' +
    '<circle cx="22" cy="50" r="1.8"></circle>' +
    '<circle cx="31" cy="40" r="1.6"></circle>' +
    '</g>',
  stripes:
    '<g class="ov ov-stripes" stroke="var(--pet-eye)" stroke-width="1.8" stroke-linecap="round" opacity="0.2" fill="none">' +
    '<path d="M18,44 Q26,40 34,45"></path>' +
    '<path d="M17,49 Q26,46 35,50"></path>' +
    '<path d="M19,54 Q26,52 33,55"></path>' +
    '</g>',
  patch:
    '<g class="ov ov-patch" opacity="0.55">' +
    '<ellipse cx="24" cy="46" rx="7" ry="6" fill="var(--pet-accent)"></ellipse>' +
    '</g>'
}

export const ACCESSORY_SVG: Record<SpriteAccessory, string> = {
  scarf:
    '<g class="ov ov-scarf">' +
    '<path d="M19,33 Q30,39 41,33 L40,37 Q30,42 20,37 Z" fill="var(--pet-accent)"></path>' +
    '<path d="M37,35 l3,9 l4,-1 l-3,-9 Z" fill="var(--pet-accent)"></path>' +
    '</g>',
  cap:
    '<g class="ov ov-cap">' +
    '<path d="M21,12 Q30,2 40,12 Z" fill="var(--pet-accent)"></path>' +
    '<rect x="20" y="11" width="21" height="3.4" rx="1.7" fill="var(--pet-accent)"></rect>' +
    '<circle cx="30.5" cy="3.6" r="1.8" fill="var(--pet-eye)" opacity="0.5"></circle>' +
    '</g>',
  glasses:
    '<g class="ov ov-glasses" fill="none" stroke="var(--pet-eye)" stroke-width="1.4" opacity="0.85">' +
    '<circle cx="38" cy="24" r="4"></circle>' +
    '<circle cx="48" cy="24" r="4"></circle>' +
    '<path d="M42,24 H44"></path>' +
    '</g>'
}

/**
 * Compose a variant's overlays onto a species SVG string (patterns under
 * accessories, both above the body). Returns the SVG unchanged when the
 * variant carries no overlays.
 */
export function composeVariantSvg(speciesSvg: string, v: SpriteVariant): string {
  const parts: string[] = []
  if (v.pattern) parts.push(PATTERN_SVG[v.pattern])
  if (v.accessory) parts.push(ACCESSORY_SVG[v.accessory])
  if (parts.length === 0) return speciesSvg
  const close = speciesSvg.lastIndexOf('</svg>')
  if (close === -1) return speciesSvg + parts.join('')
  return speciesSvg.slice(0, close) + parts.join('') + speciesSvg.slice(close)
}

/** The three colour channels as inline-style CSS vars for a variant. */
export function variantCssVars(v: SpriteVariant): Record<string, string> {
  return {
    color: v.palette.body,
    '--pet-accent': v.palette.accent,
    '--pet-eye': v.palette.eye
  }
}

/** Class list for a sprite element rendering this variant. */
export function variantClassName(v: SpriteVariant, base = 'pet'): string {
  return v.shiny ? `${base} pet--shiny` : base
}

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
}

/** Badge/aura colour per rarity tier (for Zoo chrome). */
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9aa0ad',
  uncommon: '#5fae6a',
  rare: '#4f8ef7',
  epic: '#a766d6',
  legendary: '#e8a13a'
}

import type { CSSProperties } from 'react'
import type { SpriteVariant } from '../../../shared/types'
import type { PetMood } from '../../../shared/pet-mood'
import { resolvePet } from '../pets/registry'
import { composeVariantSvg, variantCssVars } from '../../../shared/variant'

interface Props {
  variant: SpriteVariant
  /** Which mood face to show (static — no animation). */
  mood?: PetMood
  /** Square size in px. */
  size?: number
}

/**
 * A static (non-animated) sprite preview for a collectible variant: resolves
 * the base species art, composes any pattern/accessory overlays, and applies
 * the variant's palette + shiny treatment. Used throughout the Zoo.
 */
export function VariantSprite({
  variant,
  mood = 'idle',
  size = 44
}: Props): React.JSX.Element | null {
  const base = resolvePet(variant.species)
  if (!base) return null
  const svg = composeVariantSvg(base.svg, variant)
  const style = { ...variantCssVars(variant), width: size, height: size } as CSSProperties
  return (
    <span
      className={`vsprite${variant.shiny ? ' vsprite--shiny' : ''}`}
      data-mood={mood}
      style={style}
      aria-hidden
    >
      <span className="pet-svg" dangerouslySetInnerHTML={{ __html: svg }} />
    </span>
  )
}

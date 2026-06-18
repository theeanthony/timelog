/**
 * Perchable spots inside each habitat scene — the painted props (branches,
 * rooftops, lily pads, clouds, coral, …) that a companion can hop up and sit on.
 *
 * Zones are expressed in the scene's own coordinate space (the 320×480 viewBox
 * every habitat scene uses). `HabitatBackdrop` paints an invisible overlay SVG
 * with the SAME viewBox + `preserveAspectRatio="xMidYMid slice"`, so a zone at
 * (x,y) lands pixel-exact on the art no matter how the panel crops it. Each rect
 * carries `data-perch`; `PetLayer`'s perch scanner finds them by that attribute
 * and reads their on-screen box via getBoundingClientRect (which honours the
 * slice cropping for free).
 *
 * A zone's TOP edge is the surface a pet's feet land on — place it at the top of
 * the prop. Keep zones clear of any painted critter silhouettes, and roughly in
 * the y≈150–410 band so they survive both the tall panel crop and the wide Zoo
 * crop. Pure + asset-free so it can be unit-tested.
 */
import type { Habitat } from './types'

export interface PerchZone {
  /** Left edge in scene units (0–320). */
  x: number
  /** Top edge = the surface feet rest on, in scene units (0–480). */
  y: number
  /** Width in scene units. */
  w: number
  /** Height in scene units. */
  h: number
  /** What the pet is sitting on (for readability; not rendered). */
  on: string
}

/** Perchable props per habitat, in 320×480 scene coordinates. */
export const HABITAT_PERCHES: Record<Habitat, PerchZone[]> = {
  home: [
    { x: 112, y: 178, w: 96, h: 10, on: 'windowsill' },
    { x: 128, y: 346, w: 46, h: 12, on: 'stool' }
  ],
  city: [
    { x: 74, y: 296, w: 42, h: 10, on: 'rooftop' },
    { x: 180, y: 306, w: 54, h: 10, on: 'rooftop' },
    { x: 246, y: 326, w: 52, h: 10, on: 'rooftop' }
  ],
  forest: [
    { x: 200, y: 392, w: 64, h: 12, on: 'fallen log' },
    { x: 142, y: 250, w: 36, h: 10, on: 'fern crown' }
  ],
  jungle: [
    { x: 86, y: 104, w: 40, h: 10, on: 'canopy leaf' },
    { x: 130, y: 362, w: 52, h: 12, on: 'mossy mound' }
  ],
  grassland: [{ x: 58, y: 228, w: 52, h: 12, on: 'acacia branch' }],
  desert: [
    { x: 58, y: 296, w: 26, h: 11, on: 'cactus' },
    { x: 226, y: 320, w: 22, h: 11, on: 'cactus' }
  ],
  wetland: [
    { x: 62, y: 351, w: 36, h: 10, on: 'lily pad' },
    { x: 160, y: 391, w: 40, h: 11, on: 'lily pad' },
    { x: 234, y: 343, w: 32, h: 10, on: 'lily pad' }
  ],
  swamp: [
    { x: 122, y: 348, w: 40, h: 12, on: 'log' },
    { x: 100, y: 370, w: 36, h: 10, on: 'lily pad' },
    { x: 188, y: 393, w: 40, h: 11, on: 'lily pad' }
  ],
  mountain: [
    { x: 66, y: 176, w: 34, h: 10, on: 'snowy peak' },
    { x: 96, y: 336, w: 40, h: 10, on: 'ridge' }
  ],
  cave: [{ x: 138, y: 342, w: 44, h: 12, on: 'crystal cluster' }],
  volcano: [{ x: 200, y: 402, w: 42, h: 12, on: 'scorched rock' }],
  tundra: [
    { x: 140, y: 286, w: 44, h: 12, on: 'snow ridge' },
    { x: 150, y: 252, w: 34, h: 10, on: 'ice shard' }
  ],
  ocean: [{ x: 128, y: 388, w: 44, h: 12, on: 'coral head' }],
  sky: [
    { x: 40, y: 176, w: 40, h: 10, on: 'cloud' },
    { x: 62, y: 286, w: 56, h: 14, on: 'cloud' },
    { x: 198, y: 348, w: 64, h: 14, on: 'cloud' }
  ]
}

export function habitatPerches(h: Habitat): PerchZone[] {
  return HABITAT_PERCHES[h] ?? []
}

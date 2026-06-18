/**
 * Ambient motion per habitat — the drifting/rising/falling particles that make a
 * scene feel alive instead of being a still image. Rendered by `AmbientLayer` as
 * a field of small CSS-animated dots over the scene art (panel backdrop + Zoo
 * dioramas). Pure data so it can be unit-tested and shared.
 */
import type { Habitat } from './types'

/** Motion style of a habitat's ambient particles. */
export type AmbientKind =
  | 'firefly' // soft glow, wanders + pulses (forest/wetland)
  | 'bubble' // rises and pops (ocean)
  | 'ember' // rises fast and flickers (volcano)
  | 'snow' // falls and drifts (mountain/tundra)
  | 'spore' // drifts slowly upward (jungle/swamp)
  | 'dust' // very slow warm motes (home/desert)
  | 'twinkle' // stationary, twinkles (sky stars / city lights)
  | 'pollen' // warm drifting motes that glow faintly (grassland)
  | 'glow' // pulsing point lights (cave crystals)

export interface HabitatAmbient {
  kind: AmbientKind
  /** How many particles (scaled by the layer's density prop). */
  count: number
  /** Particle colour. */
  color: string
}

export const HABITAT_AMBIENT: Record<Habitat, HabitatAmbient> = {
  home: { kind: 'dust', count: 8, color: '#ffce8a' },
  city: { kind: 'twinkle', count: 11, color: '#ffd98a' },
  forest: { kind: 'firefly', count: 11, color: '#bdf27a' },
  jungle: { kind: 'spore', count: 11, color: '#9be7a0' },
  grassland: { kind: 'pollen', count: 10, color: '#ffe07a' },
  desert: { kind: 'dust', count: 10, color: '#f4d9a0' },
  wetland: { kind: 'firefly', count: 10, color: '#8fe0c0' },
  swamp: { kind: 'spore', count: 10, color: '#a7cf8f' },
  mountain: { kind: 'snow', count: 13, color: '#dbeafe' },
  cave: { kind: 'glow', count: 11, color: '#6fe0ff' },
  volcano: { kind: 'ember', count: 13, color: '#ff7a3c' },
  tundra: { kind: 'snow', count: 16, color: '#ffffff' },
  ocean: { kind: 'bubble', count: 13, color: '#bfe9ff' },
  sky: { kind: 'twinkle', count: 15, color: '#fff3c4' }
}

export function habitatAmbient(h: Habitat): HabitatAmbient {
  return HABITAT_AMBIENT[h]
}

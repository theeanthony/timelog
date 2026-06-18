/**
 * Periodic environment events per habitat — the occasional flourish a biome
 * fires on its own (a shooting star in the sky, an eruption in the volcano,
 * leaves drifting down in the forest). Each maps to an `.evt-<kind>` element
 * the diorama spawns briefly; the names match the keyframes in main.css.
 * Pure data, DOM/asset-free.
 */
import type { Habitat } from './types'

export type EnvEvent =
  | 'lamp'
  | 'leaffall'
  | 'gust'
  | 'heat'
  | 'ripple'
  | 'aurora'
  | 'wave'
  | 'shoot'
  | 'flicker'
  | 'cryspulse'
  | 'erupt'

export const HABITAT_EVENTS: Record<Habitat, EnvEvent> = {
  home: 'lamp',
  city: 'flicker',
  forest: 'leaffall',
  jungle: 'leaffall',
  grassland: 'gust',
  desert: 'heat',
  wetland: 'ripple',
  swamp: 'ripple',
  mountain: 'aurora',
  cave: 'cryspulse',
  volcano: 'erupt',
  tundra: 'aurora',
  ocean: 'wave',
  sky: 'shoot'
}

export function habitatEvent(h: Habitat): EnvEvent {
  return HABITAT_EVENTS[h]
}

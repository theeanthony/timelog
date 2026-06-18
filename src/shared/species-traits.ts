/**
 * Per-species behavioural traits — DOM/asset-free so both main and renderer
 * (and the diorama engine + panel pet-layer) can share them.
 *
 * `loco` mirrors the species' locomotion; `act` is the signature one-shot move
 * a critter performs when tapped or when it spontaneously emotes. The act
 * names map 1:1 to the `[data-act="<act>"]` keyframes in main.css.
 */
import type { Locomotion } from './types'

/** Signature one-shot moves (the `data-act` CSS contract). */
export type SignatureAct =
  | 'pounce'
  | 'hop'
  | 'soar'
  | 'bound'
  | 'dart'
  | 'roll'
  | 'flutter'
  | 'swing'
  | 'slither'
  | 'headbutt'
  | 'slide'
  | 'ooze'

export interface SpeciesTrait {
  loco: Locomotion
  act: SignatureAct
}

/** Trait table for every built-in species id. */
export const SPECIES_TRAITS: Record<string, SpeciesTrait> = {
  // home
  cat: { loco: 'walk', act: 'pounce' },
  dog: { loco: 'walk', act: 'bound' },
  // forest
  fox: { loco: 'walk', act: 'pounce' },
  rabbit: { loco: 'walk', act: 'hop' },
  deer: { loco: 'walk', act: 'bound' },
  owl: { loco: 'fly', act: 'soar' },
  hedgehog: { loco: 'walk', act: 'roll' },
  // ocean
  fish: { loco: 'swim', act: 'dart' },
  crab: { loco: 'walk', act: 'dart' },
  turtle: { loco: 'swim', act: 'roll' },
  // sky
  bird: { loco: 'fly', act: 'soar' },
  butterfly: { loco: 'fly', act: 'flutter' },
  bee: { loco: 'fly', act: 'flutter' },
  // jungle
  monkey: { loco: 'walk', act: 'swing' },
  parrot: { loco: 'fly', act: 'flutter' },
  snake: { loco: 'walk', act: 'slither' },
  // grassland
  lion: { loco: 'walk', act: 'pounce' },
  zebra: { loco: 'walk', act: 'bound' },
  meerkat: { loco: 'walk', act: 'dart' },
  // desert
  lizard: { loco: 'walk', act: 'dart' },
  fennec: { loco: 'walk', act: 'pounce' },
  camel: { loco: 'walk', act: 'bound' },
  // wetland
  frog: { loco: 'walk', act: 'hop' },
  duck: { loco: 'swim', act: 'dart' },
  heron: { loco: 'fly', act: 'soar' },
  // swamp
  toad: { loco: 'walk', act: 'hop' },
  gator: { loco: 'swim', act: 'dart' },
  dragonfly: { loco: 'fly', act: 'flutter' },
  // mountain
  goat: { loco: 'walk', act: 'headbutt' },
  eagle: { loco: 'fly', act: 'soar' },
  ram: { loco: 'walk', act: 'headbutt' },
  // cave
  bat: { loco: 'fly', act: 'flutter' },
  mole: { loco: 'walk', act: 'dart' },
  glowbug: { loco: 'walk', act: 'dart' },
  // volcano
  salamander: { loco: 'walk', act: 'dart' },
  lavaslug: { loco: 'walk', act: 'ooze' },
  phoenix: { loco: 'fly', act: 'soar' },
  // tundra
  penguin: { loco: 'walk', act: 'slide' },
  seal: { loco: 'swim', act: 'dart' },
  arcticfox: { loco: 'walk', act: 'pounce' },
  // city
  pigeon: { loco: 'fly', act: 'flutter' },
  raccoon: { loco: 'walk', act: 'dart' },
  rat: { loco: 'walk', act: 'dart' }
}

/** The signature act for a species id, defaulting to a friendly hop. */
export function speciesAct(id: string): SignatureAct {
  return SPECIES_TRAITS[id]?.act ?? 'hop'
}

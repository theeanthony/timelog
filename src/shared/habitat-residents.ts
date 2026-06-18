/**
 * Which species live in each habitat — the roster that populates a habitat's
 * living diorama (roaming residents), independent of what the user has
 * collected. A species can appear in more than one habitat (e.g. the rat lives
 * both at `home` and in the `city`). DOM/asset-free; ids join to `species.ts`
 * and the renderer registry.
 */
import type { Habitat } from './types'

export const HABITAT_RESIDENTS: Record<Habitat, string[]> = {
  home: ['cat', 'dog', 'rat'],
  city: ['pigeon', 'raccoon', 'rat'],
  forest: ['deer', 'owl', 'hedgehog', 'fox', 'rabbit'],
  jungle: ['monkey', 'parrot', 'snake'],
  grassland: ['lion', 'zebra', 'meerkat', 'rabbit'],
  desert: ['lizard', 'fennec', 'camel'],
  wetland: ['frog', 'duck', 'heron'],
  swamp: ['toad', 'gator', 'dragonfly'],
  mountain: ['goat', 'eagle', 'ram'],
  cave: ['bat', 'mole', 'glowbug'],
  volcano: ['salamander', 'lavaslug', 'phoenix'],
  tundra: ['penguin', 'seal', 'arcticfox'],
  ocean: ['fish', 'crab', 'turtle'],
  sky: ['butterfly', 'bee', 'bird']
}

/** Resident species ids for a habitat (falls back to a lone cat). */
export function habitatResidents(habitat: Habitat): string[] {
  return HABITAT_RESIDENTS[habitat] ?? ['cat']
}

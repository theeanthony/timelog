/**
 * The species catalog — asset-free metadata for every base critter.
 *
 * This is the single source of truth for *what* species exist (id, name,
 * habitat, default palette, roll weight). The renderer registry joins each
 * entry to its inline SVG markup; the variant engine (`sprite-gen.ts`) rolls
 * collectibles over this catalog. Kept DOM/asset-free so it can be unit-tested
 * and imported from both main and renderer.
 *
 * To add a species: add an entry here AND its SVG in the renderer registry.
 */
import type { Habitat, Locomotion } from './types'

export interface Species {
  id: string
  name: string
  habitat: Habitat
  /** Default palette — the plain "common" look. */
  base: { body: string; accent: string; eye: string }
  /** Relative roll weight within its habitat (rarer species → lower weight). */
  weight: number
  /** How it moves on the panel; defaults to 'walk' when omitted. */
  locomotion?: Locomotion
}

/** All habitats, in display order. */
export const HABITATS: Habitat[] = [
  'home',
  'city',
  'forest',
  'jungle',
  'grassland',
  'desert',
  'wetland',
  'swamp',
  'mountain',
  'cave',
  'volcano',
  'tundra',
  'ocean',
  'sky'
]

/** Human-readable habitat names. */
export const HABITAT_NAMES: Record<Habitat, string> = {
  home: 'Home',
  city: 'City',
  forest: 'Forest',
  jungle: 'Jungle',
  grassland: 'Grassland',
  desert: 'Desert',
  wetland: 'Wetland',
  swamp: 'Swamp',
  mountain: 'Mountain',
  cave: 'Cave',
  volcano: 'Volcano',
  tundra: 'Tundra',
  ocean: 'Ocean',
  sky: 'Sky'
}

export const SPECIES: Species[] = [
  // Home
  {
    id: 'cat',
    name: 'Cat',
    habitat: 'home',
    base: { body: '#9aa0ad', accent: '#f0954c', eye: '#14131a' },
    weight: 10
  },
  {
    id: 'dog',
    name: 'Dog',
    habitat: 'home',
    base: { body: '#c8a06a', accent: '#6b4a2b', eye: '#14131a' },
    weight: 10
  },
  // Forest
  {
    id: 'fox',
    name: 'Fox',
    habitat: 'forest',
    base: { body: '#e0823d', accent: '#f6e7d6', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'rabbit',
    name: 'Rabbit',
    habitat: 'forest',
    base: { body: '#d8d3df', accent: '#f3b6c2', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'deer',
    name: 'Deer',
    habitat: 'forest',
    base: { body: '#b07a4a', accent: '#f3e6d2', eye: '#14131a' },
    weight: 6
  },
  {
    id: 'owl',
    name: 'Owl',
    habitat: 'forest',
    base: { body: '#8a6f52', accent: '#e6d6b8', eye: '#14131a' },
    weight: 6,
    locomotion: 'fly'
  },
  {
    id: 'hedgehog',
    name: 'Hedgehog',
    habitat: 'forest',
    base: { body: '#8a7a64', accent: '#efe0c4', eye: '#14131a' },
    weight: 7
  },
  // Ocean
  {
    id: 'fish',
    name: 'Fish',
    habitat: 'ocean',
    base: { body: '#3fa6c4', accent: '#f2d27a', eye: '#14131a' },
    weight: 8,
    locomotion: 'swim'
  },
  {
    id: 'crab',
    name: 'Crab',
    habitat: 'ocean',
    base: { body: '#d85a3c', accent: '#f4a07a', eye: '#14131a' },
    weight: 7
  },
  {
    id: 'turtle',
    name: 'Turtle',
    habitat: 'ocean',
    base: { body: '#5d8a52', accent: '#c9b46a', eye: '#14131a' },
    weight: 6,
    locomotion: 'swim'
  },
  // Sky
  {
    id: 'bird',
    name: 'Bird',
    habitat: 'sky',
    base: { body: '#5b8def', accent: '#f0c000', eye: '#14131a' },
    weight: 8,
    locomotion: 'fly'
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    habitat: 'sky',
    base: { body: '#9a6ad0', accent: '#f4b6d6', eye: '#14131a' },
    weight: 6,
    locomotion: 'fly'
  },
  {
    id: 'bee',
    name: 'Bee',
    habitat: 'sky',
    base: { body: '#f0c12e', accent: '#2e2620', eye: '#14131a' },
    weight: 7,
    locomotion: 'fly'
  },
  // Jungle
  {
    id: 'monkey',
    name: 'Monkey',
    habitat: 'jungle',
    base: { body: '#8a5a3c', accent: '#d9a679', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'parrot',
    name: 'Parrot',
    habitat: 'jungle',
    base: { body: '#2fa84e', accent: '#f2c14e', eye: '#14131a' },
    weight: 7,
    locomotion: 'fly'
  },
  {
    id: 'snake',
    name: 'Snake',
    habitat: 'jungle',
    base: { body: '#5aa84e', accent: '#c9d96a', eye: '#14131a' },
    weight: 6
  },
  // Grassland
  {
    id: 'lion',
    name: 'Lion',
    habitat: 'grassland',
    base: { body: '#d9a45b', accent: '#8a5a2c', eye: '#14131a' },
    weight: 6
  },
  {
    id: 'zebra',
    name: 'Zebra',
    habitat: 'grassland',
    base: { body: '#e8e6ea', accent: '#2a2730', eye: '#14131a' },
    weight: 7
  },
  {
    id: 'meerkat',
    name: 'Meerkat',
    habitat: 'grassland',
    base: { body: '#b89a72', accent: '#6f5a3f', eye: '#14131a' },
    weight: 8
  },
  // Desert
  {
    id: 'lizard',
    name: 'Lizard',
    habitat: 'desert',
    base: { body: '#9bb04e', accent: '#c9d98a', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'fennec',
    name: 'Fennec Fox',
    habitat: 'desert',
    base: { body: '#e8d2a8', accent: '#f6e7d6', eye: '#14131a' },
    weight: 7
  },
  {
    id: 'camel',
    name: 'Camel',
    habitat: 'desert',
    base: { body: '#c8a06a', accent: '#8a6a3f', eye: '#14131a' },
    weight: 6
  },
  // Wetland
  {
    id: 'frog',
    name: 'Frog',
    habitat: 'wetland',
    base: { body: '#5aa84e', accent: '#bfe07a', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'duck',
    name: 'Duck',
    habitat: 'wetland',
    base: { body: '#c8b06a', accent: '#4e8a5a', eye: '#14131a' },
    weight: 7,
    locomotion: 'swim'
  },
  {
    id: 'heron',
    name: 'Heron',
    habitat: 'wetland',
    base: { body: '#9aa6b0', accent: '#e6e9ee', eye: '#14131a' },
    weight: 6,
    locomotion: 'fly'
  },
  // Swamp
  {
    id: 'toad',
    name: 'Toad',
    habitat: 'swamp',
    base: { body: '#7a6a4a', accent: '#9a8a5a', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'gator',
    name: 'Gator',
    habitat: 'swamp',
    base: { body: '#3f5e3a', accent: '#6f8a4e', eye: '#14131a' },
    weight: 6,
    locomotion: 'swim'
  },
  {
    id: 'dragonfly',
    name: 'Dragonfly',
    habitat: 'swamp',
    base: { body: '#4ec6c2', accent: '#a78bfa', eye: '#14131a' },
    weight: 7,
    locomotion: 'fly'
  },
  // Mountain
  {
    id: 'goat',
    name: 'Goat',
    habitat: 'mountain',
    base: { body: '#d8d3c8', accent: '#8a7a64', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'eagle',
    name: 'Eagle',
    habitat: 'mountain',
    base: { body: '#6b4a2c', accent: '#f6e7d6', eye: '#14131a' },
    weight: 6,
    locomotion: 'fly'
  },
  {
    id: 'ram',
    name: 'Ram',
    habitat: 'mountain',
    base: { body: '#c8b8a0', accent: '#8a6a4a', eye: '#14131a' },
    weight: 7
  },
  // Cave
  {
    id: 'bat',
    name: 'Bat',
    habitat: 'cave',
    base: { body: '#4a4150', accent: '#6f6880', eye: '#14131a' },
    weight: 8,
    locomotion: 'fly'
  },
  {
    id: 'mole',
    name: 'Mole',
    habitat: 'cave',
    base: { body: '#6f5a4a', accent: '#c9a679', eye: '#14131a' },
    weight: 7
  },
  {
    id: 'glowbug',
    name: 'Glowbug',
    habitat: 'cave',
    base: { body: '#6f7a4e', accent: '#bdf27a', eye: '#14131a' },
    weight: 6
  },
  // Volcano
  {
    id: 'salamander',
    name: 'Salamander',
    habitat: 'volcano',
    base: { body: '#d8453c', accent: '#ffb24a', eye: '#14131a' },
    weight: 7
  },
  {
    id: 'lavaslug',
    name: 'Lava Slug',
    habitat: 'volcano',
    base: { body: '#3a2218', accent: '#ff7a2c', eye: '#14131a' },
    weight: 6
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    habitat: 'volcano',
    base: { body: '#e8612a', accent: '#ffd27a', eye: '#14131a' },
    weight: 3,
    locomotion: 'fly'
  },
  // Tundra
  {
    id: 'penguin',
    name: 'Penguin',
    habitat: 'tundra',
    base: { body: '#2a2f3a', accent: '#f4f4f4', eye: '#14131a' },
    weight: 8
  },
  {
    id: 'seal',
    name: 'Seal',
    habitat: 'tundra',
    base: { body: '#9aa6b0', accent: '#cdd6de', eye: '#14131a' },
    weight: 7,
    locomotion: 'swim'
  },
  {
    id: 'arcticfox',
    name: 'Arctic Fox',
    habitat: 'tundra',
    base: { body: '#e8eef4', accent: '#cfd9e2', eye: '#14131a' },
    weight: 6
  },
  // City
  {
    id: 'pigeon',
    name: 'Pigeon',
    habitat: 'city',
    base: { body: '#9aa6b0', accent: '#6f7a86', eye: '#14131a' },
    weight: 8,
    locomotion: 'fly'
  },
  {
    id: 'raccoon',
    name: 'Raccoon',
    habitat: 'city',
    base: { body: '#6f6f78', accent: '#2a2730', eye: '#14131a' },
    weight: 7
  },
  {
    id: 'rat',
    name: 'Rat',
    habitat: 'city',
    base: { body: '#8a8a92', accent: '#d9a6b0', eye: '#14131a' },
    weight: 9
  }
]

export const SPECIES_IDS: string[] = SPECIES.map((s) => s.id)

export function speciesById(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id)
}

export function speciesInHabitat(habitat: Habitat): Species[] {
  return SPECIES.filter((s) => s.habitat === habitat)
}

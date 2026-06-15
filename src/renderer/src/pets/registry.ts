import type { CustomPet } from '../../../shared/types'
import catSvg from '../assets/pets/cat.svg?raw'
import dogSvg from '../assets/pets/dog.svg?raw'
import foxSvg from '../assets/pets/fox.svg?raw'
import birdSvg from '../assets/pets/bird.svg?raw'
import rabbitSvg from '../assets/pets/rabbit.svg?raw'

/** A resolved pet ready to render: inline SVG markup + its three colours. */
export interface PetDef {
  id: string
  name: string
  /** The sprite's body colour (its `currentColor`). */
  body: string
  accent: string
  eye: string
  svg: string
}

/** Built-in pets, each with default per-species colours. */
export const PETS: PetDef[] = [
  { id: 'cat', name: 'Cat', body: '#9aa0ad', accent: '#f0954c', eye: '#14131a', svg: catSvg },
  { id: 'dog', name: 'Dog', body: '#c8a06a', accent: '#6b4a2b', eye: '#14131a', svg: dogSvg },
  { id: 'fox', name: 'Fox', body: '#e0823d', accent: '#f6e7d6', eye: '#14131a', svg: foxSvg },
  { id: 'bird', name: 'Bird', body: '#5b8def', accent: '#f0c000', eye: '#14131a', svg: birdSvg },
  {
    id: 'rabbit',
    name: 'Rabbit',
    body: '#d8d3df',
    accent: '#f3b6c2',
    eye: '#14131a',
    svg: rabbitSvg
  }
]

export const PET_IDS = PETS.map((p) => p.id)

/** Resolve a pet id from the built-ins or the user's uploaded pets. */
export function resolvePet(id: string, customPets: CustomPet[] = []): PetDef | null {
  return PETS.find((p) => p.id === id) ?? customPets.find((p) => p.id === id) ?? null
}

/** Built-ins plus customs, for pickers. */
export function allPets(customPets: CustomPet[] = []): PetDef[] {
  return [...PETS, ...customPets]
}

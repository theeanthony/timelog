import type { CustomPet, Habitat, Locomotion } from '../../../shared/types'
import { SPECIES } from '../../../shared/species'
import catSvg from '../assets/pets/cat.svg?raw'
import dogSvg from '../assets/pets/dog.svg?raw'
import foxSvg from '../assets/pets/fox.svg?raw'
import birdSvg from '../assets/pets/bird.svg?raw'
import rabbitSvg from '../assets/pets/rabbit.svg?raw'
import deerSvg from '../assets/pets/deer.svg?raw'
import owlSvg from '../assets/pets/owl.svg?raw'
import hedgehogSvg from '../assets/pets/hedgehog.svg?raw'
import fishSvg from '../assets/pets/fish.svg?raw'
import crabSvg from '../assets/pets/crab.svg?raw'
import turtleSvg from '../assets/pets/turtle.svg?raw'
import butterflySvg from '../assets/pets/butterfly.svg?raw'
import beeSvg from '../assets/pets/bee.svg?raw'
import monkeySvg from '../assets/pets/monkey.svg?raw'
import parrotSvg from '../assets/pets/parrot.svg?raw'
import snakeSvg from '../assets/pets/snake.svg?raw'
import lionSvg from '../assets/pets/lion.svg?raw'
import zebraSvg from '../assets/pets/zebra.svg?raw'
import meerkatSvg from '../assets/pets/meerkat.svg?raw'
import lizardSvg from '../assets/pets/lizard.svg?raw'
import fennecSvg from '../assets/pets/fennec.svg?raw'
import camelSvg from '../assets/pets/camel.svg?raw'
import frogSvg from '../assets/pets/frog.svg?raw'
import duckSvg from '../assets/pets/duck.svg?raw'
import heronSvg from '../assets/pets/heron.svg?raw'
import toadSvg from '../assets/pets/toad.svg?raw'
import gatorSvg from '../assets/pets/gator.svg?raw'
import dragonflySvg from '../assets/pets/dragonfly.svg?raw'
import goatSvg from '../assets/pets/goat.svg?raw'
import eagleSvg from '../assets/pets/eagle.svg?raw'
import ramSvg from '../assets/pets/ram.svg?raw'
import batSvg from '../assets/pets/bat.svg?raw'
import moleSvg from '../assets/pets/mole.svg?raw'
import glowbugSvg from '../assets/pets/glowbug.svg?raw'
import salamanderSvg from '../assets/pets/salamander.svg?raw'
import lavaslugSvg from '../assets/pets/lavaslug.svg?raw'
import phoenixSvg from '../assets/pets/phoenix.svg?raw'
import penguinSvg from '../assets/pets/penguin.svg?raw'
import sealSvg from '../assets/pets/seal.svg?raw'
import arcticfoxSvg from '../assets/pets/arcticfox.svg?raw'
import pigeonSvg from '../assets/pets/pigeon.svg?raw'
import raccoonSvg from '../assets/pets/raccoon.svg?raw'
import ratSvg from '../assets/pets/rat.svg?raw'

/** A resolved pet ready to render: inline SVG markup + its three colours. */
export interface PetDef {
  id: string
  name: string
  /** Habitat this species belongs to (custom uploads default to 'home'). */
  habitat: Habitat
  /** How it moves on the panel (custom uploads default to 'walk'). */
  locomotion: Locomotion
  /** The sprite's body colour (its `currentColor`). */
  body: string
  accent: string
  eye: string
  svg: string
}

/** Inline SVG markup for each built-in species id. */
const SPECIES_SVG: Record<string, string> = {
  cat: catSvg,
  dog: dogSvg,
  fox: foxSvg,
  bird: birdSvg,
  rabbit: rabbitSvg,
  deer: deerSvg,
  owl: owlSvg,
  hedgehog: hedgehogSvg,
  fish: fishSvg,
  crab: crabSvg,
  turtle: turtleSvg,
  butterfly: butterflySvg,
  bee: beeSvg,
  monkey: monkeySvg,
  parrot: parrotSvg,
  snake: snakeSvg,
  lion: lionSvg,
  zebra: zebraSvg,
  meerkat: meerkatSvg,
  lizard: lizardSvg,
  fennec: fennecSvg,
  camel: camelSvg,
  frog: frogSvg,
  duck: duckSvg,
  heron: heronSvg,
  toad: toadSvg,
  gator: gatorSvg,
  dragonfly: dragonflySvg,
  goat: goatSvg,
  eagle: eagleSvg,
  ram: ramSvg,
  bat: batSvg,
  mole: moleSvg,
  glowbug: glowbugSvg,
  salamander: salamanderSvg,
  lavaslug: lavaslugSvg,
  phoenix: phoenixSvg,
  penguin: penguinSvg,
  seal: sealSvg,
  arcticfox: arcticfoxSvg,
  pigeon: pigeonSvg,
  raccoon: raccoonSvg,
  rat: ratSvg
}

/**
 * Built-in pets: the species catalog joined to its SVG markup. Only species
 * that have artwork are surfaced (so the catalog can list planned species
 * before their SVG lands without rendering blanks).
 */
export const PETS: PetDef[] = SPECIES.filter((s) => SPECIES_SVG[s.id]).map((s) => ({
  id: s.id,
  name: s.name,
  habitat: s.habitat,
  locomotion: s.locomotion ?? 'walk',
  body: s.base.body,
  accent: s.base.accent,
  eye: s.base.eye,
  svg: SPECIES_SVG[s.id]
}))

export const PET_IDS = PETS.map((p) => p.id)

/** Coerce a user-uploaded pet into a PetDef (customs have no habitat). */
function fromCustom(c: CustomPet): PetDef {
  return { ...c, habitat: 'home', locomotion: 'walk' }
}

/** Resolve a pet id from the built-ins or the user's uploaded pets. */
export function resolvePet(id: string, customPets: CustomPet[] = []): PetDef | null {
  const builtin = PETS.find((p) => p.id === id)
  if (builtin) return builtin
  const custom = customPets.find((p) => p.id === id)
  return custom ? fromCustom(custom) : null
}

/** Built-ins plus customs, for pickers. */
export function allPets(customPets: CustomPet[] = []): PetDef[] {
  return [...PETS, ...customPets.map(fromCustom)]
}

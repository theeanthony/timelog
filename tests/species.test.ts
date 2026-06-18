import { describe, expect, it } from 'vitest'
import { HABITATS, SPECIES, SPECIES_IDS, speciesInHabitat } from '../src/shared/species'
import { SPECIES_TRAITS } from '../src/shared/species-traits'
import { HABITAT_RESIDENTS, habitatResidents } from '../src/shared/habitat-residents'

describe('species catalog', () => {
  it('populates every habitat with at least one species', () => {
    for (const h of HABITATS) {
      expect(speciesInHabitat(h).length).toBeGreaterThan(0)
    }
  })

  it('has the full 43-species roster with unique ids', () => {
    expect(SPECIES.length).toBe(43)
    expect(new Set(SPECIES_IDS).size).toBe(SPECIES.length)
  })

  it('gives every species a 3-channel palette', () => {
    for (const s of SPECIES) {
      expect(s.base.body).toMatch(/^#[0-9a-f]{6}$/i)
      expect(s.base.accent).toMatch(/^#[0-9a-f]{6}$/i)
      expect(s.base.eye).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('species traits', () => {
  it('defines a trait for every species', () => {
    for (const id of SPECIES_IDS) {
      expect(SPECIES_TRAITS[id]).toBeDefined()
    }
  })

  it('every trait id resolves to a real species', () => {
    for (const id of Object.keys(SPECIES_TRAITS)) {
      expect(SPECIES_IDS).toContain(id)
    }
  })

  it('trait locomotion agrees with the catalog', () => {
    for (const s of SPECIES) {
      expect(SPECIES_TRAITS[s.id].loco).toBe(s.locomotion ?? 'walk')
    }
  })
})

describe('habitat residents', () => {
  it('lists residents for every habitat that all resolve to real species', () => {
    for (const h of HABITATS) {
      const roster = habitatResidents(h)
      expect(roster.length).toBeGreaterThan(0)
      for (const id of roster) expect(SPECIES_IDS).toContain(id)
    }
  })

  it('covers exactly the habitat set', () => {
    expect(Object.keys(HABITAT_RESIDENTS).sort()).toEqual([...HABITATS].sort())
  })
})

import { describe, expect, it } from 'vitest'
import { HABITAT_AMBIENT, habitatAmbient } from '../src/shared/habitat-ambient'
import { HABITATS } from '../src/shared/species'

const KINDS = ['firefly', 'bubble', 'ember', 'snow', 'spore', 'dust', 'twinkle', 'pollen', 'glow']

describe('habitat ambient', () => {
  it('defines an ambient effect for every habitat', () => {
    for (const h of HABITATS) {
      const a = habitatAmbient(h)
      expect(KINDS).toContain(a.kind)
      expect(a.count).toBeGreaterThan(0)
      expect(a.color).toMatch(/^#[0-9a-f]{3,8}$/i)
    }
  })

  it('covers exactly the habitat set', () => {
    expect(Object.keys(HABITAT_AMBIENT).sort()).toEqual([...HABITATS].sort())
  })
})

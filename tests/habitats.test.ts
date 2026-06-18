import { describe, expect, it } from 'vitest'
import { HABITAT_THEMES, habitatTheme } from '../src/shared/habitats'
import { HABITATS } from '../src/shared/species'

describe('habitat themes', () => {
  it('defines a theme for every habitat', () => {
    for (const h of HABITATS) {
      const t = habitatTheme(h)
      expect(t.id).toBe(h)
      expect(t.name).toBeTruthy()
      expect(t.background).toBeTruthy()
      expect(typeof t.scene).toBe('string')
    }
  })

  it('scene strings, when present, are SVG markup', () => {
    for (const h of HABITATS) {
      const { scene } = HABITAT_THEMES[h]
      if (scene) {
        expect(scene.startsWith('<svg')).toBe(true)
        expect(scene.endsWith('</svg>')).toBe(true)
      }
    }
  })

  it('every habitat now ships real scene art', () => {
    for (const h of HABITATS) {
      const { scene } = habitatTheme(h)
      expect(scene.length).toBeGreaterThan(200)
      expect(scene).toContain('viewBox="0 0 320 480"')
    }
  })

  it('includes the full biome set (jungle, desert, cave, volcano, …)', () => {
    for (const h of ['jungle', 'desert', 'cave', 'volcano', 'city', 'swamp'] as const) {
      expect(HABITATS).toContain(h)
    }
    expect(HABITATS.length).toBeGreaterThanOrEqual(14)
    for (const h of HABITATS) expect(HABITAT_THEMES[h].id).toBe(h)
  })
})

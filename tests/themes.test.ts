import { describe, expect, it } from 'vitest'
import { resolveTheme, THEMES, EDITABLE_VARS } from '../src/shared/themes'

describe('theme resolution', () => {
  it('returns a preset base + its var overrides', () => {
    const r = resolveTheme('midnight')
    expect(r.base).toBe('dark')
    expect(r.vars['--bg']).toBe('#0d1117')
  })

  it('built-in dark/light carry no var overrides (baseline CSS handles them)', () => {
    expect(resolveTheme('dark')).toEqual({ base: 'dark', vars: {} })
    expect(resolveTheme('light')).toEqual({ base: 'light', vars: {} })
  })

  it('system honours the injectable prefers-light flag', () => {
    expect(resolveTheme('system', {}, true).base).toBe('light')
    expect(resolveTheme('system', {}, false).base).toBe('dark')
  })

  it('custom uses __base and strips it from the applied vars', () => {
    const r = resolveTheme('custom', { __base: 'light', '--bg': '#fff' })
    expect(r.base).toBe('light')
    expect(r.vars).toEqual({ '--bg': '#fff' })
  })

  it('unknown theme id falls back to dark', () => {
    expect(resolveTheme('nope')).toEqual({ base: 'dark', vars: {} })
  })

  it('every preset only sets known editable vars', () => {
    const allowed = new Set(EDITABLE_VARS.map((v) => v.var))
    for (const t of THEMES) {
      for (const name of Object.keys(t.vars)) expect(allowed.has(name)).toBe(true)
    }
  })
})

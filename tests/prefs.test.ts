import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { getPrefs, setPrefs } from '../src/main/prefs'
import { DEFAULT_PREFS } from '../src/shared/types'
import { DWELL_MS, IDLE_SECONDS } from '../src/main/engine/tracker'

describe('preferences', () => {
  it('defaults mirror the engine constants so untouched DBs behave identically', () => {
    const db = openDatabase(':memory:')
    const prefs = getPrefs(db)
    expect(prefs).toEqual(DEFAULT_PREFS)
    expect(prefs.idleTimeoutSec).toBe(IDLE_SECONDS)
    expect(prefs.dwellSec * 1000).toBe(DWELL_MS)
  })

  it('round-trips booleans, numbers and strings', () => {
    const db = openDatabase(':memory:')
    setPrefs(db, { launchAtLogin: true, idleTimeoutSec: 600, theme: 'light' })
    const prefs = getPrefs(db)
    expect(prefs.launchAtLogin).toBe(true)
    expect(prefs.idleTimeoutSec).toBe(600)
    expect(prefs.theme).toBe('light')
    // Unset keys keep their defaults.
    expect(prefs.alwaysOnTop).toBe(DEFAULT_PREFS.alwaysOnTop)
  })

  it('round-trips object and array prefs as JSON', () => {
    const db = openDatabase(':memory:')
    setPrefs(db, {
      pets: ['cat', 'cat', 'fox'],
      customColors: { '--bg': '#000000', __base: 'light' },
      customPets: [
        {
          id: 'custom-1',
          name: 'blob',
          svg: '<svg></svg>',
          body: '#111',
          accent: '#222',
          eye: '#333'
        }
      ]
    })
    const prefs = getPrefs(db)
    expect(prefs.pets).toEqual(['cat', 'cat', 'fox'])
    expect(prefs.customColors).toEqual({ '--bg': '#000000', __base: 'light' })
    expect(prefs.customPets[0].name).toBe('blob')
  })

  it('falls back to the default when a stored object pref is corrupt', () => {
    const db = openDatabase(':memory:')
    // Simulate a corrupt JSON value written out of band.
    db.prepare('INSERT INTO app_state (key, value) VALUES (?, ?)').run('pref_pets', '{bad json')
    expect(getPrefs(db).pets).toEqual(DEFAULT_PREFS.pets)
  })
})

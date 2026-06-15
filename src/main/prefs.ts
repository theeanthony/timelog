import { DEFAULT_PREFS, type Prefs } from '../shared/types'
import type { Db } from './db/database'
import { getState, setState } from './db/app-state'

const PREFIX = 'pref_'

/**
 * Preferences live as individual app_state rows (`pref_<key>`) so a single
 * setting can change without rewriting a blob. Missing rows fall back to
 * DEFAULT_PREFS, which deliberately mirrors the engine's built-in constants.
 */
export function getPrefs(db: Db): Prefs {
  const out = { ...DEFAULT_PREFS }
  for (const key of Object.keys(DEFAULT_PREFS) as (keyof Prefs)[]) {
    const raw = getState(db, PREFIX + key)
    if (raw === null) continue
    const def = DEFAULT_PREFS[key]
    if (typeof def === 'boolean') (out[key] as boolean) = raw === '1'
    else if (typeof def === 'number') (out[key] as number) = Number(raw)
    else if (typeof def === 'object' && def !== null) {
      // Arrays/objects (pets, customColors, customPets) are JSON-encoded; a
      // corrupt value falls back to the default rather than crashing startup.
      try {
        ;(out[key] as unknown) = JSON.parse(raw)
      } catch {
        /* keep default */
      }
    } else (out[key] as string) = raw
  }
  return out
}

export function setPrefs(db: Db, patch: Partial<Prefs>): Prefs {
  for (const [key, value] of Object.entries(patch)) {
    const stored =
      typeof value === 'boolean'
        ? value
          ? '1'
          : '0'
        : typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : String(value)
    setState(db, PREFIX + key, stored)
  }
  return getPrefs(db)
}

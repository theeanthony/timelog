import { useCallback, useEffect, useState } from 'react'
import type { Prefs } from '../../../shared/types'

/** Loads preferences and exposes an optimistic-ish updater backed by IPC. */
export function usePrefs(): {
  prefs: Prefs | null
  update: (patch: Partial<Prefs>) => Promise<void>
} {
  const [prefs, setPrefs] = useState<Prefs | null>(null)

  useEffect(() => {
    void window.timelog.getPrefs().then(setPrefs)
  }, [])

  const update = useCallback(async (patch: Partial<Prefs>): Promise<void> => {
    const next = await window.timelog.setPrefs(patch)
    setPrefs(next)
  }, [])

  return { prefs, update }
}

export { resolveTheme } from '../../../shared/themes'

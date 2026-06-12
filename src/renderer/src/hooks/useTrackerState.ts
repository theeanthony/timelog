import { useEffect, useState } from 'react'
import type { TrackerState } from '../../../shared/types'

/**
 * Subscribes to tracker state pushes from main and runs a 1 s display tick.
 * Display time always derives from DB-backed totals + the open session's
 * start timestamp — the renderer never accumulates its own counter.
 */
export function useTrackerState(): { state: TrackerState | null; nowMs: number } {
  const [state, setState] = useState<TrackerState | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  useEffect(() => {
    window.timelog.getState().then(setState)
    return window.timelog.onState(setState)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return { state, nowMs }
}

/** Today's total for a project: closed sessions + the open one if it's theirs. */
export function todayTotalMs(state: TrackerState, code: string, nowMs: number): number {
  const closed = state.todayMsByProject[code] ?? 0
  const isOpenHere = state.activeProject?.code === code && state.openSessionStartTs !== null
  const open = isOpenHere ? Math.max(0, nowMs - state.openSessionStartTs!) : 0
  return closed + open
}

export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

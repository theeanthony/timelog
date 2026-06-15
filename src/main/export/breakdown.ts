import type { DayBreakdown, RangeBreakdown, RangeUnit, WeekBreakdown } from '../../shared/types'
import type { Db } from '../db/database'
import { sessionsOverlapping } from '../db/sessions'
import { listProjects } from '../db/projects'

/**
 * Per-day, per-project totals for `numDays` starting at startIso. Sessions
 * spanning midnight are split across the days they overlap. Day boundaries are
 * local time (Date arithmetic, so DST transitions land on real local midnights).
 */
export function computeDayBreakdowns(db: Db, startIso: string, numDays: number): DayBreakdown[] {
  const [y, m, d] = startIso.split('-').map(Number)
  const dayStarts = Array.from({ length: numDays + 1 }, (_, i) =>
    new Date(y, m - 1, d + i).getTime()
  )
  const sessions = sessionsOverlapping(db, dayStarts[0], dayStarts[numDays])

  const pad = (n: number): string => String(n).padStart(2, '0')
  const days: DayBreakdown[] = Array.from({ length: numDays }, (_, i) => {
    const date = new Date(y, m - 1, d + i)
    return {
      dateIso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      msByProject: {},
      totalMs: 0
    }
  })

  for (const s of sessions) {
    for (let i = 0; i < numDays; i++) {
      const overlap = Math.min(s.endTs!, dayStarts[i + 1]) - Math.max(s.startTs, dayStarts[i])
      if (overlap <= 0) continue
      const day = days[i]
      day.msByProject[s.projectCode] = (day.msByProject[s.projectCode] ?? 0) + overlap
      day.totalMs += overlap
    }
  }
  return days
}

/** One week (7 days, Monday first). Kept for the existing IPC + tests. */
export function computeWeekBreakdown(db: Db, weekStartIso: string): WeekBreakdown {
  return { weekStartIso, days: computeDayBreakdowns(db, weekStartIso, 7) }
}

/**
 * A week or month breakdown plus per-project totals across the whole span,
 * sorted descending. Powers the report sheet's chart + totals tab.
 */
export function computeRangeBreakdown(
  db: Db,
  unit: RangeUnit,
  startIso: string,
  numDays: number
): RangeBreakdown {
  const days = computeDayBreakdowns(db, startIso, numDays)
  const spanMs: Record<string, number> = {}
  for (const day of days) {
    for (const [code, ms] of Object.entries(day.msByProject)) {
      spanMs[code] = (spanMs[code] ?? 0) + ms
    }
  }
  const labelByCode = Object.fromEntries(
    listProjects(db, { includeArchived: true }).map((p) => [p.code, p.label])
  )
  const totals = Object.entries(spanMs)
    .map(([code, ms]) => {
      const totalMinutes = Math.round(ms / 60_000)
      return {
        code,
        label: labelByCode[code] ?? code,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        totalMs: ms
      }
    })
    .sort((a, b) => b.totalMs - a.totalMs)
  return { unit, startIso, days, totals }
}

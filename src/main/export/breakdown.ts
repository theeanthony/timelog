import type { WeekBreakdown } from '../../shared/types'
import type { Db } from '../db/database'
import { sessionsOverlapping } from '../db/sessions'

/**
 * Per-day, per-project totals for one week. Sessions spanning midnight are
 * split across the days they overlap. Day boundaries are local time
 * (Date arithmetic, so DST transitions land on real local midnights).
 */
export function computeWeekBreakdown(db: Db, weekStartIso: string): WeekBreakdown {
  const [y, m, d] = weekStartIso.split('-').map(Number)
  const dayStarts = Array.from({ length: 8 }, (_, i) => new Date(y, m - 1, d + i).getTime())
  const sessions = sessionsOverlapping(db, dayStarts[0], dayStarts[7])

  const pad = (n: number): string => String(n).padStart(2, '0')
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(y, m - 1, d + i)
    return {
      dateIso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      msByProject: {} as Record<string, number>,
      totalMs: 0
    }
  })

  for (const s of sessions) {
    for (let i = 0; i < 7; i++) {
      const overlap = Math.min(s.endTs!, dayStarts[i + 1]) - Math.max(s.startTs, dayStarts[i])
      if (overlap <= 0) continue
      const day = days[i]
      day.msByProject[s.projectCode] = (day.msByProject[s.projectCode] ?? 0) + overlap
      day.totalMs += overlap
    }
  }

  return { weekStartIso, days }
}

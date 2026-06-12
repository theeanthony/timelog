import type { WeekTotals } from '../../shared/types'
import type { Db } from '../db/database'
import { listProjects } from '../db/projects'
import { totalsByProject } from '../db/sessions'

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** weekStartIso: 'YYYY-MM-DD' of the week's first day (local time). */
export function weekRange(weekStartIso: string): { fromTs: number; toTs: number } {
  const [y, m, d] = weekStartIso.split('-').map(Number)
  const from = new Date(y, m - 1, d, 0, 0, 0, 0)
  const to = new Date(y, m - 1, d + 7, 0, 0, 0, 0)
  return { fromTs: from.getTime(), toTs: to.getTime() }
}

export { currentWeekStartIso } from '../../shared/week'

export function computeWeekTotals(db: Db, weekStartIso: string): WeekTotals {
  const { fromTs, toTs } = weekRange(weekStartIso)
  const totals = totalsByProject(db, fromTs, toTs)
  const projects = listProjects(db)
  const rows = projects
    .filter((p) => (totals[p.code] ?? 0) > 0)
    .map((p) => {
      const ms = totals[p.code]
      const totalMinutes = Math.round(ms / 60_000)
      return {
        code: p.code,
        label: p.label,
        hours: Math.floor(totalMinutes / 60),
        minutes: totalMinutes % 60,
        totalMs: ms
      }
    })
  return { weekStartIso, rows }
}

export function weekTotalsToCsv(totals: WeekTotals): string {
  const escape = (v: string): string => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const lines = ['charge_code,label,hours,minutes,decimal_hours']
  for (const r of totals.rows) {
    const decimal = (r.totalMs / 3_600_000).toFixed(2)
    lines.push([escape(r.code), escape(r.label), String(r.hours), String(r.minutes), decimal].join(','))
  }
  return lines.join('\n') + '\n'
}

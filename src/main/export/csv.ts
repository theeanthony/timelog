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

/** Monday of the week containing epochMs, as 'YYYY-MM-DD' (local). */
export function currentWeekStartIso(epochMs: number): string {
  const d = new Date(epochMs)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() - ((dow + 6) % 7))
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

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

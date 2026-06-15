import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { addProject } from '../src/main/db/projects'
import { closeSession, openSession } from '../src/main/db/sessions'
import { computeRangeBreakdown } from '../src/main/export/breakdown'
import { daysInMonth, monthStartIso } from '../src/shared/week'

const WEEK = '2026-06-08' // Monday
const monday = new Date(2026, 5, 8, 0, 0, 0, 0).getTime()
const h = (n: number): number => n * 3_600_000

function seed(): ReturnType<typeof openDatabase> {
  const db = openDatabase(':memory:')
  addProject(db, { code: 'A', label: 'Alpha', color: '#111' }, monday)
  addProject(db, { code: 'B', label: 'Beta', color: '#222' }, monday)
  return db
}

function closed(
  db: ReturnType<typeof openDatabase>,
  code: string,
  start: number,
  end: number
): void {
  const id = openSession(db, code, start, 'auto')
  closeSession(db, id, end, 'normal')
}

describe('range breakdown', () => {
  it('produces per-project totals sorted descending for a week', () => {
    const db = seed()
    closed(db, 'A', monday + h(9), monday + h(11)) // 2h A
    closed(db, 'B', monday + h(13), monday + h(18)) // 5h B

    const r = computeRangeBreakdown(db, 'week', WEEK, 7)
    expect(r.days).toHaveLength(7)
    expect(r.totals.map((t) => t.code)).toEqual(['B', 'A'])
    expect(r.totals[0].totalMs).toBe(h(5))
    expect(r.totals[0].hours).toBe(5)
  })

  it('spans a full month worth of days', () => {
    const db = seed()
    const start = monthStartIso(monday)
    const r = computeRangeBreakdown(db, 'month', start, daysInMonth(start))
    expect(r.unit).toBe('month')
    expect(r.days).toHaveLength(30) // June
  })
})

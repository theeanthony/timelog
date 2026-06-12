import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { addProject } from '../src/main/db/projects'
import { closeSession, openSession } from '../src/main/db/sessions'
import { computeWeekBreakdown } from '../src/main/export/breakdown'

// Monday 2026-06-08 00:00 local
const WEEK = '2026-06-08'
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

describe('week breakdown', () => {
  it('returns 7 days, Monday first, with correct dates', () => {
    const b = computeWeekBreakdown(seed(), WEEK)
    expect(b.days).toHaveLength(7)
    expect(b.days[0].dateIso).toBe('2026-06-08')
    expect(b.days[6].dateIso).toBe('2026-06-14')
  })

  it('buckets sessions into the right days per project', () => {
    const db = seed()
    closed(db, 'A', monday + h(9), monday + h(11)) // mon 2h A
    closed(db, 'B', monday + h(13), monday + h(14)) // mon 1h B
    closed(db, 'A', monday + h(24 + 9), monday + h(24 + 17)) // tue 8h A

    const b = computeWeekBreakdown(db, WEEK)
    expect(b.days[0].msByProject).toEqual({ A: h(2), B: h(1) })
    expect(b.days[0].totalMs).toBe(h(3))
    expect(b.days[1].msByProject).toEqual({ A: h(8) })
    expect(b.days[2].totalMs).toBe(0)
  })

  it('splits a session spanning midnight across both days', () => {
    const db = seed()
    closed(db, 'A', monday + h(22), monday + h(26)) // mon 22:00 → tue 02:00

    const b = computeWeekBreakdown(db, WEEK)
    expect(b.days[0].msByProject.A).toBe(h(2))
    expect(b.days[1].msByProject.A).toBe(h(2))
  })

  it('clamps sessions overlapping the week edges', () => {
    const db = seed()
    // Sunday before → Monday 01:00, and Sunday 23:00 → Monday after
    closed(db, 'A', monday - h(2), monday + h(1))
    closed(db, 'B', monday + h(6 * 24 + 23), monday + h(7 * 24 + 2))

    const b = computeWeekBreakdown(db, WEEK)
    expect(b.days[0].msByProject.A).toBe(h(1))
    expect(b.days[6].msByProject.B).toBe(h(1))
  })

  it('ignores open sessions', () => {
    const db = seed()
    openSession(db, 'A', monday + h(9), 'auto')
    const b = computeWeekBreakdown(db, WEEK)
    expect(b.days[0].totalMs).toBe(0)
  })
})

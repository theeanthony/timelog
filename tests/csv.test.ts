import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { addProject } from '../src/main/db/projects'
import { openSession, closeSession } from '../src/main/db/sessions'
import {
  computeWeekTotals,
  currentWeekStartIso,
  weekRange,
  weekTotalsToCsv
} from '../src/main/export/csv'

// Monday 2026-06-08 00:00 local
const WEEK = '2026-06-08'
const weekStart = weekRange(WEEK).fromTs
const h = (n: number): number => n * 3_600_000

function seedDb(): ReturnType<typeof openDatabase> {
  const db = openDatabase(':memory:')
  addProject(db, { code: '7741-002', label: 'Substation A', color: '#5B8DEF' }, weekStart)
  addProject(
    db,
    { code: '7741-105', label: 'Feeder calcs, "phase 2"', color: '#43B97F' },
    weekStart
  )
  return db
}

function addClosedSession(
  db: ReturnType<typeof openDatabase>,
  code: string,
  startTs: number,
  endTs: number
): void {
  const id = openSession(db, code, startTs, 'auto')
  closeSession(db, id, endTs, 'normal')
}

describe('weekly totals', () => {
  it('groups closed sessions by charge code with hours and minutes', () => {
    const db = seedDb()
    addClosedSession(db, '7741-002', weekStart + h(9), weekStart + h(11.5)) // 2h30m
    addClosedSession(db, '7741-002', weekStart + h(13), weekStart + h(14)) // 1h
    addClosedSession(db, '7741-105', weekStart + h(15), weekStart + h(15.75)) // 45m

    const totals = computeWeekTotals(db, WEEK)
    expect(totals.rows).toEqual([
      expect.objectContaining({ code: '7741-002', hours: 3, minutes: 30 }),
      expect.objectContaining({ code: '7741-105', hours: 0, minutes: 45 })
    ])
  })

  it('clamps a session spanning the week boundary to the week', () => {
    const db = seedDb()
    // Starts 1h before the week, ends 2h into it → only 2h counted.
    addClosedSession(db, '7741-002', weekStart - h(1), weekStart + h(2))
    const totals = computeWeekTotals(db, WEEK)
    expect(totals.rows[0]).toEqual(expect.objectContaining({ hours: 2, minutes: 0 }))
  })

  it('omits projects with no time and ignores open sessions', () => {
    const db = seedDb()
    openSession(db, '7741-002', weekStart + h(9), 'auto') // still open
    const totals = computeWeekTotals(db, WEEK)
    expect(totals.rows).toHaveLength(0)
  })
})

describe('CSV generation', () => {
  it('produces the expected golden output with quoting', () => {
    const db = seedDb()
    addClosedSession(db, '7741-002', weekStart + h(9), weekStart + h(11.5))
    addClosedSession(db, '7741-105', weekStart + h(13), weekStart + h(14.25))

    const csv = weekTotalsToCsv(computeWeekTotals(db, WEEK))
    expect(csv).toBe(
      'charge_code,label,hours,minutes,decimal_hours\n' +
        '7741-002,Substation A,2,30,2.50\n' +
        '7741-105,"Feeder calcs, ""phase 2""",1,15,1.25\n'
    )
  })
})

describe('week start helper', () => {
  it('returns the Monday of the containing week', () => {
    const thursday = new Date(2026, 5, 11, 15, 30).getTime() // Thu Jun 11 2026
    expect(currentWeekStartIso(thursday)).toBe('2026-06-08')
    const monday = new Date(2026, 5, 8, 0, 0).getTime()
    expect(currentWeekStartIso(monday)).toBe('2026-06-08')
    const sunday = new Date(2026, 5, 14, 23, 59).getTime()
    expect(currentWeekStartIso(sunday)).toBe('2026-06-08')
  })
})

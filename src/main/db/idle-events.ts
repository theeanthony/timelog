import type { IdleEvent } from '../../shared/types'
import type { Db } from './database'

interface IdleEventRow {
  id: number
  project_code: string
  gap_start_ts: number
  gap_end_ts: number
  resolved: number
}

function toIdleEvent(r: IdleEventRow): IdleEvent {
  return {
    id: r.id,
    projectCode: r.project_code,
    gapStartTs: r.gap_start_ts,
    gapEndTs: r.gap_end_ts
  }
}

export function recordIdleEvent(
  db: Db,
  projectCode: string,
  gapStartTs: number,
  gapEndTs: number
): number {
  const result = db
    .prepare('INSERT INTO idle_events (project_code, gap_start_ts, gap_end_ts) VALUES (?, ?, ?)')
    .run(projectCode, gapStartTs, gapEndTs)
  return Number(result.lastInsertRowid)
}

export function listPendingIdle(db: Db): IdleEvent[] {
  const rows = db
    .prepare(
      'SELECT id, project_code, gap_start_ts, gap_end_ts, resolved FROM idle_events WHERE resolved = 0 ORDER BY gap_end_ts'
    )
    .all() as unknown as IdleEventRow[]
  return rows.map(toIdleEvent)
}

export function getIdleEvent(db: Db, id: number): IdleEvent | null {
  const r = db
    .prepare(
      'SELECT id, project_code, gap_start_ts, gap_end_ts, resolved FROM idle_events WHERE id = ?'
    )
    .get(id) as unknown as IdleEventRow | undefined
  return r ? toIdleEvent(r) : null
}

export function resolveIdleEvent(db: Db, id: number): void {
  db.prepare('UPDATE idle_events SET resolved = 1 WHERE id = ?').run(id)
}

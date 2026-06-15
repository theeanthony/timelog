import type { ClosedReason, Session, SessionSource } from '../../shared/types'
import type { Db } from './database'
import { KEYS, deleteState, getState, setState } from './app-state'

const MAX_SESSION_MS = 24 * 60 * 60 * 1000

interface SessionRow {
  id: number
  project_code: string
  start_ts: number
  end_ts: number | null
  source: string
  closed_reason: string | null
}

function toSession(r: SessionRow): Session {
  return {
    id: r.id,
    projectCode: r.project_code,
    startTs: r.start_ts,
    endTs: r.end_ts,
    source: r.source as SessionSource,
    closedReason: r.closed_reason as ClosedReason | null
  }
}

export function openSession(
  db: Db,
  projectCode: string,
  startTs: number,
  source: SessionSource
): number {
  const result = db
    .prepare('INSERT INTO sessions (project_code, start_ts, source) VALUES (?, ?, ?)')
    .run(projectCode, startTs, source)
  const id = Number(result.lastInsertRowid)
  setState(db, KEYS.openSessionId, String(id))
  return id
}

export function getOpenSession(db: Db): Session | null {
  const idStr = getState(db, KEYS.openSessionId)
  if (!idStr) return null
  const row = db
    .prepare('SELECT * FROM sessions WHERE id = ? AND end_ts IS NULL')
    .get(Number(idStr)) as unknown | undefined
  return row ? toSession(row as SessionRow) : null
}

/**
 * Close a session, applying the drift guard: sessions with negative or
 * > 24 h duration are deleted rather than saved as garbage.
 */
export function closeSession(db: Db, id: number, endTs: number, reason: ClosedReason): void {
  const row = db.prepare('SELECT start_ts FROM sessions WHERE id = ?').get(id) as
    | { start_ts: number }
    | undefined
  if (row) {
    const duration = endTs - row.start_ts
    if (duration <= 0 || duration > MAX_SESSION_MS) {
      db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
    } else {
      db.prepare('UPDATE sessions SET end_ts = ?, closed_reason = ? WHERE id = ?').run(
        endTs,
        reason,
        id
      )
    }
  }
  deleteState(db, KEYS.openSessionId)
}

/**
 * Crash recovery on launch: if the recorded open session was never closed,
 * cap it at the last heartbeat. Returns the recovered session id, if any.
 */
export function recoverOrphanedSession(db: Db): number | null {
  const open = getOpenSession(db)
  if (!open) {
    deleteState(db, KEYS.openSessionId)
    return null
  }
  const heartbeat = Number(getState(db, KEYS.heartbeatTs) ?? NaN)
  const endTs = Number.isFinite(heartbeat) ? heartbeat : open.startTs
  closeSession(db, open.id, endTs, 'crash_recovery')
  return open.id
}

/** Sum of closed-session ms per project within [fromTs, toTs). */
export function totalsByProject(db: Db, fromTs: number, toTs: number): Record<string, number> {
  const rows = db
    .prepare(
      `SELECT project_code, SUM(MIN(end_ts, ?) - MAX(start_ts, ?)) AS ms
       FROM sessions
       WHERE end_ts IS NOT NULL AND end_ts > ? AND start_ts < ?
       GROUP BY project_code`
    )
    .all(toTs, fromTs, fromTs, toTs) as unknown as { project_code: string; ms: number }[]
  const totals: Record<string, number> = {}
  for (const r of rows) totals[r.project_code] = r.ms
  return totals
}

/** Closed sessions overlapping [fromTs, toTs), including ones that start before it. */
export function sessionsOverlapping(db: Db, fromTs: number, toTs: number): Session[] {
  const rows = db
    .prepare(
      'SELECT * FROM sessions WHERE end_ts IS NOT NULL AND end_ts > ? AND start_ts < ? ORDER BY start_ts'
    )
    .all(fromTs, toTs) as unknown as SessionRow[]
  return rows.map(toSession)
}

export function listSessions(db: Db, fromTs: number, toTs: number): Session[] {
  const rows = db
    .prepare('SELECT * FROM sessions WHERE start_ts >= ? AND start_ts < ? ORDER BY start_ts')
    .all(fromTs, toTs) as unknown as SessionRow[]
  return rows.map(toSession)
}

/** Whether [startTs, endTs) is a sane closed-session span (drift guard). */
export function isValidSpan(startTs: number, endTs: number): boolean {
  const duration = endTs - startTs
  return duration > 0 && duration <= MAX_SESSION_MS
}

/**
 * Insert an already-closed session — used for manual "log time I forgot"
 * entries and for keeping/reassigning reviewed idle time. Returns the new id,
 * or null if the span fails the drift guard.
 */
export function insertClosedSession(
  db: Db,
  projectCode: string,
  startTs: number,
  endTs: number,
  source: SessionSource = 'manual',
  reason: ClosedReason = 'normal'
): number | null {
  if (!isValidSpan(startTs, endTs)) return null
  const result = db
    .prepare(
      'INSERT INTO sessions (project_code, start_ts, end_ts, source, closed_reason) VALUES (?, ?, ?, ?, ?)'
    )
    .run(projectCode, startTs, endTs, source, reason)
  return Number(result.lastInsertRowid)
}

export function reassignSession(db: Db, id: number, newCode: string): void {
  db.prepare('UPDATE sessions SET project_code = ? WHERE id = ?').run(newCode, id)
}

export function deleteSession(db: Db, id: number): void {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
}

/** Split a closed session at atTs into two adjacent sessions. Returns new id. */
export function splitSession(db: Db, id: number, atTs: number): number | null {
  const s = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as unknown as
    | SessionRow
    | undefined
  if (!s || s.end_ts === null || atTs <= s.start_ts || atTs >= s.end_ts) return null
  db.prepare('UPDATE sessions SET end_ts = ? WHERE id = ?').run(atTs, id)
  const result = db
    .prepare(
      'INSERT INTO sessions (project_code, start_ts, end_ts, source, closed_reason) VALUES (?, ?, ?, ?, ?)'
    )
    .run(s.project_code, atTs, s.end_ts, s.source, s.closed_reason ?? 'normal')
  return Number(result.lastInsertRowid)
}

import type { UnmatchedWindow } from '../../shared/types'
import type { Db } from './database'

interface UnmatchedRow {
  app: string
  title: string
  last_seen: number
  seen_count: number
}

function toUnmatched(r: UnmatchedRow): UnmatchedWindow {
  return { app: r.app, title: r.title, lastSeen: r.last_seen, seenCount: r.seen_count }
}

/**
 * Record an auto-mode window that matched no rule, so the user can review and
 * assign it later. Upserts on (app, title), bumping the count and last-seen.
 */
export function recordUnmatched(db: Db, app: string, title: string, nowMs: number): void {
  if (!app && !title) return
  db.prepare(
    `INSERT INTO unmatched_windows (app, title, last_seen, seen_count) VALUES (?, ?, ?, 1)
     ON CONFLICT(app, title) DO UPDATE SET last_seen = excluded.last_seen, seen_count = seen_count + 1`
  ).run(app, title, nowMs)
}

/** Most-recently-seen unmatched windows first. */
export function listUnmatched(db: Db, limit = 50): UnmatchedWindow[] {
  const rows = db
    .prepare(
      'SELECT app, title, last_seen, seen_count FROM unmatched_windows ORDER BY last_seen DESC LIMIT ?'
    )
    .all(limit) as unknown as UnmatchedRow[]
  return rows.map(toUnmatched)
}

/** Forget one observation (after it's been assigned), or all of them. */
export function clearUnmatched(db: Db, app?: string, title?: string): void {
  if (app === undefined || title === undefined) {
    db.prepare('DELETE FROM unmatched_windows').run()
    return
  }
  db.prepare('DELETE FROM unmatched_windows WHERE app = ? AND title = ?').run(app, title)
}

import type { Db } from './database'

export function getState(db: Db, key: string): string | null {
  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row ? row.value : null
}

export function setState(db: Db, key: string, value: string): void {
  db.prepare(
    'INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, value)
}

export function deleteState(db: Db, key: string): void {
  db.prepare('DELETE FROM app_state WHERE key = ?').run(key)
}

export const KEYS = {
  schemaVersion: 'schema_version',
  heartbeatTs: 'heartbeat_ts',
  openSessionId: 'open_session_id',
  mode: 'mode',
  manualProjectCode: 'manual_project_code',
  setupComplete: 'setup_complete',
  windowPosition: 'window_position'
} as const

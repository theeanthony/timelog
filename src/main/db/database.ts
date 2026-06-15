// The only file that touches node:sqlite. If DatabaseSync regresses in a
// future Electron, swap this wrapper to better-sqlite3 and nothing else moves.
import { DatabaseSync } from 'node:sqlite'
import { MIGRATIONS, SCHEMA_DDL, SCHEMA_VERSION } from './schema.sql'

export type Db = DatabaseSync

export function openDatabase(path: string): Db {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db: Db): void {
  // Fresh databases get the full current schema here; existing ones only gain
  // tables they were missing (CREATE TABLE IF NOT EXISTS), with column-level
  // upgrades handled by the stepwise MIGRATIONS below.
  db.exec(SCHEMA_DDL)
  const row = db.prepare(`SELECT value FROM app_state WHERE key = 'schema_version'`).get() as
    | { value: string }
    | undefined
  if (!row) {
    // No version row means SCHEMA_DDL just built every table at the current
    // version — record it and skip the upgrade ALTERs.
    db.prepare(`INSERT INTO app_state (key, value) VALUES ('schema_version', ?)`).run(
      String(SCHEMA_VERSION)
    )
    return
  }
  let version = Number(row.value)
  for (const m of MIGRATIONS) {
    if (version < m.to) {
      db.exec(m.sql)
      version = m.to
    }
  }
  if (version !== Number(row.value)) {
    db.prepare(`UPDATE app_state SET value = ? WHERE key = 'schema_version'`).run(String(version))
  }
}

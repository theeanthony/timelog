// The only file that touches node:sqlite. If DatabaseSync regresses in a
// future Electron, swap this wrapper to better-sqlite3 and nothing else moves.
import { DatabaseSync } from 'node:sqlite'
import { SCHEMA_DDL, SCHEMA_VERSION } from './schema.sql'

export type Db = DatabaseSync

export function openDatabase(path: string): Db {
  const db = new DatabaseSync(path)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db: Db): void {
  db.exec(SCHEMA_DDL)
  const row = db
    .prepare(`SELECT value FROM app_state WHERE key = 'schema_version'`)
    .get() as { value: string } | undefined
  if (!row) {
    db.prepare(`INSERT INTO app_state (key, value) VALUES ('schema_version', ?)`).run(
      String(SCHEMA_VERSION)
    )
  }
  // Future migrations: compare Number(row.value) to SCHEMA_VERSION and step up.
}

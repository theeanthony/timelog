export const SCHEMA_VERSION = 3

export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS projects (
  code        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  color       TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  archived    INTEGER NOT NULL DEFAULT 0,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  pinned      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rules (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code TEXT NOT NULL REFERENCES projects(code),
  pattern      TEXT NOT NULL,
  priority     INTEGER NOT NULL DEFAULT 0,
  enabled      INTEGER NOT NULL DEFAULT 1,
  field        TEXT NOT NULL DEFAULT 'title'
);

CREATE TABLE IF NOT EXISTS sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code  TEXT NOT NULL REFERENCES projects(code),
  start_ts      INTEGER NOT NULL,
  end_ts        INTEGER,
  source        TEXT NOT NULL CHECK (source IN ('auto','manual')),
  closed_reason TEXT CHECK (closed_reason IN ('normal','crash_recovery','idle','lock'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_ts);

CREATE TABLE IF NOT EXISTS idle_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code  TEXT NOT NULL REFERENCES projects(code),
  gap_start_ts  INTEGER NOT NULL,
  gap_end_ts    INTEGER NOT NULL,
  resolved      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS app_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS unmatched_windows (
  app        TEXT NOT NULL,
  title      TEXT NOT NULL,
  last_seen  INTEGER NOT NULL,
  seen_count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (app, title)
);
`

/**
 * Stepwise migrations applied to databases created before SCHEMA_VERSION.
 * Each runs only when the stored version is below its target. CREATE TABLE IF
 * NOT EXISTS in SCHEMA_DDL handles fresh databases; these handle upgrades.
 */
export const MIGRATIONS: { to: number; sql: string }[] = [
  {
    to: 2,
    sql: `
      ALTER TABLE projects ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE projects ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE projects ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0;
      CREATE TABLE IF NOT EXISTS idle_events (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        project_code  TEXT NOT NULL REFERENCES projects(code),
        gap_start_ts  INTEGER NOT NULL,
        gap_end_ts    INTEGER NOT NULL,
        resolved      INTEGER NOT NULL DEFAULT 0
      );
    `
  },
  {
    to: 3,
    sql: `
      ALTER TABLE rules ADD COLUMN field TEXT NOT NULL DEFAULT 'title';
      CREATE TABLE IF NOT EXISTS unmatched_windows (
        app        TEXT NOT NULL,
        title      TEXT NOT NULL,
        last_seen  INTEGER NOT NULL,
        seen_count INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (app, title)
      );
    `
  }
]

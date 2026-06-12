export const SCHEMA_VERSION = 1

export const SCHEMA_DDL = `
CREATE TABLE IF NOT EXISTS projects (
  code        TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  color       TEXT NOT NULL,
  created_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code TEXT NOT NULL REFERENCES projects(code),
  pattern      TEXT NOT NULL,
  priority     INTEGER NOT NULL DEFAULT 0,
  enabled      INTEGER NOT NULL DEFAULT 1
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

CREATE TABLE IF NOT EXISTS app_state (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

import type { Project, Rule, RuleField } from '../../shared/types'
import type { Db } from './database'
import { KEYS, getState, setState } from './app-state'

interface ProjectRow {
  code: string
  label: string
  color: string
  created_at: number
  archived: number
  sort_order: number
  pinned: number
}

interface RuleRow {
  id: number
  project_code: string
  pattern: string
  priority: number
  enabled: number
  field: string
}

function toProject(r: ProjectRow): Project {
  return {
    code: r.code,
    label: r.label,
    color: r.color,
    createdAt: r.created_at,
    archived: r.archived === 1,
    sortOrder: r.sort_order,
    pinned: r.pinned === 1
  }
}

const PROJECT_COLS = 'code, label, color, created_at, archived, sort_order, pinned'
// Pinned first, then manual order, then creation order as a stable tiebreak.
const PROJECT_ORDER = 'ORDER BY pinned DESC, sort_order, created_at'

export function listProjects(db: Db, opts: { includeArchived?: boolean } = {}): Project[] {
  const where = opts.includeArchived ? '' : 'WHERE archived = 0'
  const rows = db
    .prepare(`SELECT ${PROJECT_COLS} FROM projects ${where} ${PROJECT_ORDER}`)
    .all() as unknown as ProjectRow[]
  return rows.map(toProject)
}

export function getProject(db: Db, code: string): Project | null {
  const r = db
    .prepare(`SELECT ${PROJECT_COLS} FROM projects WHERE code = ?`)
    .get(code) as unknown as ProjectRow | undefined
  return r ? toProject(r) : null
}

export function addProject(
  db: Db,
  p: { code: string; label: string; color: string },
  nowMs: number
): void {
  // New projects sort to the bottom of the unpinned group.
  const max = db.prepare('SELECT MAX(sort_order) AS m FROM projects').get() as { m: number | null }
  const order = (max?.m ?? 0) + 1
  db.prepare(
    'INSERT INTO projects (code, label, color, created_at, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(p.code, p.label, p.color, nowMs, order)
  // Default rule: the charge code or label appearing anywhere in a window title.
  addRule(db, p.code, defaultPatternFor(p))
}

export function updateProject(
  db: Db,
  code: string,
  patch: { label?: string; color?: string }
): void {
  const current = getProject(db, code)
  if (!current) return
  db.prepare('UPDATE projects SET label = ?, color = ? WHERE code = ?').run(
    patch.label ?? current.label,
    patch.color ?? current.color,
    code
  )
}

/**
 * Rename a charge code, cascading the new code to every table that references
 * it. Runs in a transaction so a failure leaves nothing half-renamed.
 */
export function renameProjectCode(db: Db, oldCode: string, newCode: string): void {
  if (oldCode === newCode) return
  const src = db
    .prepare(`SELECT ${PROJECT_COLS} FROM projects WHERE code = ?`)
    .get(oldCode) as unknown as ProjectRow | undefined
  if (!src) return
  if (getProject(db, newCode)) throw new Error('that charge code already exists')

  db.exec('BEGIN')
  try {
    db.prepare(
      `INSERT INTO projects (code, label, color, created_at, archived, sort_order, pinned)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(newCode, src.label, src.color, src.created_at, src.archived, src.sort_order, src.pinned)
    db.prepare('UPDATE sessions SET project_code = ? WHERE project_code = ?').run(newCode, oldCode)
    db.prepare('UPDATE rules SET project_code = ? WHERE project_code = ?').run(newCode, oldCode)
    db.prepare('UPDATE idle_events SET project_code = ? WHERE project_code = ?').run(
      newCode,
      oldCode
    )
    if (getState(db, KEYS.manualProjectCode) === oldCode) {
      setState(db, KEYS.manualProjectCode, newCode)
    }
    db.prepare('DELETE FROM projects WHERE code = ?').run(oldCode)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export function archiveProject(db: Db, code: string, archived: boolean): void {
  db.prepare('UPDATE projects SET archived = ? WHERE code = ?').run(archived ? 1 : 0, code)
}

export function setPinned(db: Db, code: string, pinned: boolean): void {
  db.prepare('UPDATE projects SET pinned = ? WHERE code = ?').run(pinned ? 1 : 0, code)
}

/** Persist a new manual order: sort_order follows the given code sequence. */
export function reorderProjects(db: Db, orderedCodes: string[]): void {
  db.exec('BEGIN')
  try {
    const stmt = db.prepare('UPDATE projects SET sort_order = ? WHERE code = ?')
    orderedCodes.forEach((code, i) => stmt.run(i, code))
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

/**
 * Permanently remove a project. Its time is either reassigned to another
 * project or deleted with it. Use archiveProject for the non-destructive path.
 */
export function deleteProject(db: Db, code: string, reassignTo?: string): void {
  db.exec('BEGIN')
  try {
    if (reassignTo) {
      db.prepare('UPDATE sessions SET project_code = ? WHERE project_code = ?').run(
        reassignTo,
        code
      )
      db.prepare('UPDATE idle_events SET project_code = ? WHERE project_code = ?').run(
        reassignTo,
        code
      )
    } else {
      db.prepare('DELETE FROM sessions WHERE project_code = ?').run(code)
      db.prepare('DELETE FROM idle_events WHERE project_code = ?').run(code)
    }
    db.prepare('DELETE FROM rules WHERE project_code = ?').run(code)
    db.prepare('DELETE FROM projects WHERE code = ?').run(code)
    if (getState(db, KEYS.manualProjectCode) === code) setState(db, KEYS.manualProjectCode, '')
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}

export function defaultPatternFor(p: { code: string; label: string }): string {
  return `${escapeRegex(p.code)}|${escapeRegex(p.label)}`
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── rules ──────────────────────────────────────────────────────────────────

function toRule(r: RuleRow): Rule {
  return {
    id: r.id,
    projectCode: r.project_code,
    pattern: r.pattern,
    priority: r.priority,
    enabled: r.enabled === 1,
    field: (r.field as RuleField) ?? 'title'
  }
}

export function addRule(
  db: Db,
  projectCode: string,
  pattern: string,
  priority = 0,
  field: RuleField = 'title'
): number {
  const result = db
    .prepare('INSERT INTO rules (project_code, pattern, priority, field) VALUES (?, ?, ?, ?)')
    .run(projectCode, pattern, priority, field)
  return Number(result.lastInsertRowid)
}

/** Make the currently-unmatched window title map to a project from now on. */
export function addRuleForTitle(db: Db, projectCode: string, title: string): number {
  // Priority 1 so an explicit user pick beats the default code/label rule.
  return addRule(db, projectCode, escapeRegex(title.trim()), 1, 'title')
}

/** Map an entire app (e.g. 'Slack') to a project — catches all its windows. */
export function addRuleForApp(db: Db, projectCode: string, appName: string): number {
  return addRule(db, projectCode, escapeRegex(appName.trim()), 1, 'app')
}

export function updateRule(
  db: Db,
  id: number,
  patch: { pattern?: string; priority?: number; enabled?: boolean; field?: RuleField }
): void {
  const row = db.prepare('SELECT * FROM rules WHERE id = ?').get(id) as unknown as
    | RuleRow
    | undefined
  if (!row) return
  db.prepare('UPDATE rules SET pattern = ?, priority = ?, enabled = ?, field = ? WHERE id = ?').run(
    patch.pattern ?? row.pattern,
    patch.priority ?? row.priority,
    patch.enabled === undefined ? row.enabled : patch.enabled ? 1 : 0,
    patch.field ?? row.field,
    id
  )
}

export function deleteRule(db: Db, id: number): void {
  db.prepare('DELETE FROM rules WHERE id = ?').run(id)
}

export function listRules(db: Db, projectCode?: string): Rule[] {
  const rows = (projectCode
    ? db
        .prepare(
          'SELECT id, project_code, pattern, priority, enabled, field FROM rules WHERE project_code = ? ORDER BY priority DESC, id'
        )
        .all(projectCode)
    : db
        .prepare(
          'SELECT id, project_code, pattern, priority, enabled, field FROM rules ORDER BY priority DESC, id'
        )
        .all()) as unknown as RuleRow[]
  return rows.map(toRule)
}

export function listEnabledRules(db: Db): Rule[] {
  const rows = db
    .prepare(
      'SELECT id, project_code, pattern, priority, enabled, field FROM rules WHERE enabled = 1 ORDER BY priority DESC, id'
    )
    .all() as unknown as RuleRow[]
  return rows.map(toRule)
}

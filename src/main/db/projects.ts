import type { Project, Rule } from '../../shared/types'
import type { Db } from './database'

interface ProjectRow {
  code: string
  label: string
  color: string
  created_at: number
}

interface RuleRow {
  id: number
  project_code: string
  pattern: string
  priority: number
  enabled: number
}

export function listProjects(db: Db): Project[] {
  const rows = db
    .prepare('SELECT code, label, color, created_at FROM projects ORDER BY created_at')
    .all() as unknown as ProjectRow[]
  return rows.map((r) => ({
    code: r.code,
    label: r.label,
    color: r.color,
    createdAt: r.created_at
  }))
}

export function getProject(db: Db, code: string): Project | null {
  const r = db
    .prepare('SELECT code, label, color, created_at FROM projects WHERE code = ?')
    .get(code) as unknown as ProjectRow | undefined
  return r ? { code: r.code, label: r.label, color: r.color, createdAt: r.created_at } : null
}

export function addProject(
  db: Db,
  p: { code: string; label: string; color: string },
  nowMs: number
): void {
  db.prepare('INSERT INTO projects (code, label, color, created_at) VALUES (?, ?, ?, ?)').run(
    p.code,
    p.label,
    p.color,
    nowMs
  )
  // Default rule: the charge code or label appearing anywhere in a window title.
  addRule(db, p.code, defaultPatternFor(p))
}

export function defaultPatternFor(p: { code: string; label: string }): string {
  const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return `${escape(p.code)}|${escape(p.label)}`
}

export function addRule(db: Db, projectCode: string, pattern: string, priority = 0): void {
  db.prepare('INSERT INTO rules (project_code, pattern, priority) VALUES (?, ?, ?)').run(
    projectCode,
    pattern,
    priority
  )
}

export function listEnabledRules(db: Db): Rule[] {
  const rows = db
    .prepare(
      'SELECT id, project_code, pattern, priority, enabled FROM rules WHERE enabled = 1 ORDER BY priority DESC, id'
    )
    .all() as unknown as RuleRow[]
  return rows.map((r) => ({
    id: r.id,
    projectCode: r.project_code,
    pattern: r.pattern,
    priority: r.priority,
    enabled: r.enabled === 1
  }))
}

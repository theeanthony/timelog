import { describe, expect, it } from 'vitest'
import { openDatabase, type Db } from '../src/main/db/database'
import {
  addProject,
  archiveProject,
  deleteProject,
  deleteRule,
  getProject,
  listEnabledRules,
  listProjects,
  listRules,
  renameProjectCode,
  reorderProjects,
  setPinned,
  updateProject,
  updateRule,
  addRuleForTitle
} from '../src/main/db/projects'
import { closeSession, openSession, totalsByProject } from '../src/main/db/sessions'
import { recordIdleEvent, listPendingIdle } from '../src/main/db/idle-events'

const T = 1_750_000_000_000

function seed(): Db {
  const db = openDatabase(':memory:')
  addProject(db, { code: 'A', label: 'Alpha', color: '#111' }, T)
  addProject(db, { code: 'B', label: 'Beta', color: '#222' }, T + 1)
  addProject(db, { code: 'C', label: 'Gamma', color: '#333' }, T + 2)
  return db
}

describe('project edit', () => {
  it('updates label and color in place', () => {
    const db = seed()
    updateProject(db, 'A', { label: 'Alpha Prime', color: '#999' })
    const p = getProject(db, 'A')!
    expect(p.label).toBe('Alpha Prime')
    expect(p.color).toBe('#999')
  })

  it('renames a code and cascades to sessions, rules and idle events', () => {
    const db = seed()
    const sid = openSession(db, 'A', T, 'auto')
    closeSession(db, sid, T + 3_600_000, 'normal')
    recordIdleEvent(db, 'A', T, T + 60_000)

    renameProjectCode(db, 'A', 'A-NEW')

    expect(getProject(db, 'A')).toBeNull()
    expect(getProject(db, 'A-NEW')).not.toBeNull()
    expect(totalsByProject(db, T, T + 7_200_000)['A-NEW']).toBe(3_600_000)
    expect(listRules(db, 'A-NEW').length).toBeGreaterThan(0)
    expect(listPendingIdle(db)[0].projectCode).toBe('A-NEW')
  })

  it('rejects renaming onto an existing code', () => {
    const db = seed()
    expect(() => renameProjectCode(db, 'A', 'B')).toThrow()
    expect(getProject(db, 'A')).not.toBeNull()
  })
})

describe('archive, pin, reorder', () => {
  it('archives without losing sessions and filters from the default list', () => {
    const db = seed()
    const sid = openSession(db, 'A', T, 'auto')
    closeSession(db, sid, T + 1_000_000, 'normal')
    archiveProject(db, 'A', true)

    expect(listProjects(db).map((p) => p.code)).not.toContain('A')
    expect(listProjects(db, { includeArchived: true }).map((p) => p.code)).toContain('A')
    expect(totalsByProject(db, T, T + 2_000_000).A).toBe(1_000_000)
  })

  it('pins to the top and honours manual order otherwise', () => {
    const db = seed()
    reorderProjects(db, ['C', 'A', 'B'])
    expect(listProjects(db).map((p) => p.code)).toEqual(['C', 'A', 'B'])
    setPinned(db, 'B', true)
    expect(listProjects(db).map((p) => p.code)).toEqual(['B', 'C', 'A'])
  })
})

describe('delete project', () => {
  it('reassigns its time when a target is given', () => {
    const db = seed()
    const sid = openSession(db, 'A', T, 'auto')
    closeSession(db, sid, T + 1_000_000, 'normal')
    deleteProject(db, 'A', 'B')
    expect(getProject(db, 'A')).toBeNull()
    expect(totalsByProject(db, T, T + 2_000_000).B).toBe(1_000_000)
  })

  it('removes its time with no target', () => {
    const db = seed()
    const sid = openSession(db, 'A', T, 'auto')
    closeSession(db, sid, T + 1_000_000, 'normal')
    deleteProject(db, 'A')
    expect(getProject(db, 'A')).toBeNull()
    expect(totalsByProject(db, T, T + 2_000_000).A).toBeUndefined()
  })
})

describe('rules CRUD', () => {
  it('lists, edits, toggles and deletes rules', () => {
    const db = seed()
    const id = addRuleForTitle(db, 'A', 'Drawing A-12 — AutoCAD')
    const all = listRules(db)
    expect(all.find((r) => r.id === id)?.priority).toBe(1)

    updateRule(db, id, { enabled: false })
    expect(listEnabledRules(db).find((r) => r.id === id)).toBeUndefined()

    updateRule(db, id, { enabled: true, pattern: 'A-12' })
    expect(listRules(db).find((r) => r.id === id)?.pattern).toBe('A-12')

    deleteRule(db, id)
    expect(listRules(db).find((r) => r.id === id)).toBeUndefined()
  })
})

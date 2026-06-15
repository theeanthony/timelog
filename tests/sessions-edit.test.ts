import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { addProject } from '../src/main/db/projects'
import {
  deleteSession,
  insertClosedSession,
  reassignSession,
  splitSession,
  totalsByProject
} from '../src/main/db/sessions'

const T = 1_750_000_000_000

function seed(): ReturnType<typeof openDatabase> {
  const db = openDatabase(':memory:')
  addProject(db, { code: 'A', label: 'Alpha', color: '#111' }, T)
  addProject(db, { code: 'B', label: 'Beta', color: '#222' }, T)
  return db
}

describe('manual session entry', () => {
  it('inserts a valid closed session and rejects bad spans', () => {
    const db = seed()
    const ok = insertClosedSession(db, 'A', T, T + 3_600_000)
    expect(ok).not.toBeNull()
    expect(totalsByProject(db, T, T + 7_200_000).A).toBe(3_600_000)

    expect(insertClosedSession(db, 'A', T + 100, T)).toBeNull() // end before start
    expect(insertClosedSession(db, 'A', T, T + 25 * 3_600_000)).toBeNull() // > 24h
  })
})

describe('reassign / delete / split', () => {
  it('reassigns a session to another project', () => {
    const db = seed()
    const id = insertClosedSession(db, 'A', T, T + 3_600_000)!
    reassignSession(db, id, 'B')
    expect(totalsByProject(db, T, T + 7_200_000)).toEqual({ B: 3_600_000 })
  })

  it('deletes a session', () => {
    const db = seed()
    const id = insertClosedSession(db, 'A', T, T + 3_600_000)!
    deleteSession(db, id)
    expect(totalsByProject(db, T, T + 7_200_000).A).toBeUndefined()
  })

  it('splits a session into two adjacent blocks', () => {
    const db = seed()
    const id = insertClosedSession(db, 'A', T, T + 3_600_000)!
    const newId = splitSession(db, id, T + 1_800_000)
    expect(newId).not.toBeNull()
    // Total unchanged, still all on A, but now two rows.
    expect(totalsByProject(db, T, T + 7_200_000).A).toBe(3_600_000)
    expect(splitSession(db, id, T - 1)).toBeNull() // out of range
  })
})

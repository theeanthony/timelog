import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { KEYS, getState, setState } from '../src/main/db/app-state'
import { addProject } from '../src/main/db/projects'
import { openSession, recoverOrphanedSession } from '../src/main/db/sessions'
import { T0, allSessions } from './helpers'

describe('crash recovery', () => {
  it('caps an orphaned open session at the last heartbeat', () => {
    const db = openDatabase(':memory:')
    addProject(db, { code: 'P-100', label: 'Alpha', color: '#fff' }, T0)
    openSession(db, 'P-100', T0, 'auto')
    setState(db, KEYS.heartbeatTs, String(T0 + 90_000)) // last heartbeat 90s in

    const recovered = recoverOrphanedSession(db)
    expect(recovered).not.toBeNull()
    const sessions = allSessions(db)
    expect(sessions[0].end_ts).toBe(T0 + 90_000)
    expect(sessions[0].closed_reason).toBe('crash_recovery')
    expect(getState(db, KEYS.openSessionId)).toBeNull()
  })

  it('discards an orphaned session with no usable heartbeat (zero duration)', () => {
    const db = openDatabase(':memory:')
    addProject(db, { code: 'P-100', label: 'Alpha', color: '#fff' }, T0)
    openSession(db, 'P-100', T0, 'auto')
    // No heartbeat ever written: cap at start_ts → zero duration → drift guard deletes.
    recoverOrphanedSession(db)
    expect(allSessions(db)).toHaveLength(0)
    expect(getState(db, KEYS.openSessionId)).toBeNull()
  })

  it('is a no-op on a clean start', () => {
    const db = openDatabase(':memory:')
    expect(recoverOrphanedSession(db)).toBeNull()
  })

  it('ignores a stale open_session_id pointing at an already-closed session', () => {
    const db = openDatabase(':memory:')
    addProject(db, { code: 'P-100', label: 'Alpha', color: '#fff' }, T0)
    const id = openSession(db, 'P-100', T0, 'auto')
    db.prepare('UPDATE sessions SET end_ts = ?, closed_reason = ? WHERE id = ?').run(
      T0 + 60_000,
      'normal',
      id
    )
    expect(recoverOrphanedSession(db)).toBeNull()
    expect(allSessions(db)[0].closed_reason).toBe('normal')
  })
})

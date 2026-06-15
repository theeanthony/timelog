import { describe, expect, it } from 'vitest'
import { openDatabase } from '../src/main/db/database'
import { addProject } from '../src/main/db/projects'
import {
  getIdleEvent,
  listPendingIdle,
  recordIdleEvent,
  resolveIdleEvent
} from '../src/main/db/idle-events'
import { totalsByProject } from '../src/main/db/sessions'
import { insertClosedSession } from '../src/main/db/sessions'
import { makeRig, T0 } from './helpers'

describe('idle-event capture (tracker)', () => {
  it('records a pending idle gap when activity returns', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(100) // ~8 min tracked

    rig.idle.idleSeconds = 360
    await rig.step() // enter idle: session closed, gap remembered
    expect(rig.tracker.getTrackerState().status).toBe('idle')

    rig.idle.idleSeconds = 0
    await rig.step() // activity returns: gap recorded for review

    const pending = rig.tracker.getTrackerState().pendingIdle
    expect(pending).toHaveLength(1)
    expect(pending[0].projectCode).toBe('P-100')
    expect(pending[0].gapEndTs).toBeGreaterThan(pending[0].gapStartTs)
  })

  it('does not record idle gaps that span a lock', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(100)

    rig.idle.idleSeconds = 360
    await rig.step() // idle
    rig.idle.fireLock() // locked before returning
    rig.idle.idleSeconds = 0
    rig.idle.fireUnlock()
    await rig.step()

    expect(rig.tracker.getTrackerState().pendingIdle).toHaveLength(0)
  })
})

describe('idle-event store', () => {
  it('keeps/discards events and only keep adds time back', () => {
    const db = openDatabase(':memory:')
    addProject(db, { code: 'A', label: 'Alpha', color: '#111' }, T0)
    addProject(db, { code: 'B', label: 'Beta', color: '#222' }, T0)

    const keepId = recordIdleEvent(db, 'A', T0, T0 + 600_000) // 10 min
    const dropId = recordIdleEvent(db, 'A', T0 + 600_000, T0 + 900_000)
    expect(listPendingIdle(db)).toHaveLength(2)

    // keep: add the gap back as a session
    const keep = getIdleEvent(db, keepId)!
    insertClosedSession(db, keep.projectCode, keep.gapStartTs, keep.gapEndTs)
    resolveIdleEvent(db, keepId)

    // discard: just resolve
    resolveIdleEvent(db, dropId)

    expect(listPendingIdle(db)).toHaveLength(0)
    expect(totalsByProject(db, T0, T0 + 3_600_000).A).toBe(600_000)
  })
})

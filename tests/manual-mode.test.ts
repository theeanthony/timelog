import { describe, expect, it } from 'vitest'
import { allSessions, makeRig } from './helpers'

describe('manual check-in tracking mode', () => {
  it('never reads the active window', async () => {
    const rig = makeRig({ trackingMode: 'manual' })
    rig.windows.setWindow('P-100 layout — AutoCAD')

    rig.tracker.setManualOverride('P-200')
    await rig.step(20)
    rig.tracker.clearOverride()
    await rig.step(20)

    expect(rig.windows.reads).toBe(0)
    expect(rig.tracker.getTrackerState().trackingMode).toBe('manual')
  })

  it('starts checked out and checks in/out by tap', async () => {
    const rig = makeRig({ trackingMode: 'manual' })
    await rig.step()
    expect(rig.tracker.getTrackerState().status).toBe('checked_out')
    expect(allSessions(rig.db)).toHaveLength(0)

    rig.tracker.setManualOverride('P-100')
    await rig.step(3)
    expect(rig.tracker.getTrackerState().status).toBe('tracking')
    expect(rig.tracker.getTrackerState().mode).toBe('manual')

    rig.clock.advance(60_000)
    rig.tracker.clearOverride() // check out
    await rig.step()
    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].source).toBe('manual')
    expect(sessions[0].end_ts).not.toBeNull()
    expect(rig.tracker.getTrackerState().status).toBe('checked_out')
  })

  it('still pauses on idle and resumes the checked-in project', async () => {
    const rig = makeRig({ trackingMode: 'manual' })
    rig.tracker.setManualOverride('P-100')
    await rig.step(130) // ~11 min checked in

    rig.idle.idleSeconds = 360
    await rig.step()
    expect(rig.tracker.getTrackerState().status).toBe('idle')
    expect(allSessions(rig.db)[0].closed_reason).toBe('idle')

    rig.idle.idleSeconds = 0
    await rig.step()
    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(2)
    expect(sessions[1].project_code).toBe('P-100')
    expect(sessions[1].end_ts).toBeNull()
    expect(rig.windows.reads).toBe(0)
  })

  it('switching tracking modes closes the open session and resets to checked out / auto', async () => {
    const rig = makeRig() // auto
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(7)
    expect(allSessions(rig.db)[0].end_ts).toBeNull()

    rig.clock.advance(1000)
    rig.tracker.setTrackingMode('manual')
    expect(allSessions(rig.db)[0].end_ts).not.toBeNull()
    expect(rig.tracker.getTrackerState().status).toBe('checked_out')

    const readsBefore = rig.windows.reads
    await rig.step(10)
    expect(rig.windows.reads).toBe(readsBefore) // polling stopped

    rig.tracker.setTrackingMode('auto')
    await rig.step(7) // dwell again
    const sessions = allSessions(rig.db)
    expect(sessions[sessions.length - 1].source).toBe('auto')
    expect(sessions[sessions.length - 1].end_ts).toBeNull()
  })
})

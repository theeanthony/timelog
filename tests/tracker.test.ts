import { describe, expect, it } from 'vitest'
import { DWELL_MS, TICK_MS } from '../src/main/engine/tracker'
import { allSessions, makeRig } from './helpers'

describe('auto tracking with dwell', () => {
  it('opens a session once a matching window has dwelled 30s', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')

    // First sighting starts the dwell clock; no session yet.
    await rig.step()
    expect(allSessions(rig.db)).toHaveLength(0)

    // After 30s of dwell the session opens, backdated to first sighting.
    await rig.step(DWELL_MS / TICK_MS)
    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].project_code).toBe('P-100')
    expect(sessions[0].source).toBe('auto')
    expect(sessions[0].end_ts).toBeNull()
  })

  it('does not switch projects before the dwell threshold', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(7) // session open on P-100

    // Glance at P-200 for two ticks (10s), then return.
    rig.windows.setWindow('P-200 schedule — Excel')
    await rig.step(2)
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(2)

    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].project_code).toBe('P-100')
    expect(sessions[0].end_ts).toBeNull()
  })

  it('switches projects after dwell, crediting the dwell window to the new project', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(7)

    rig.windows.setWindow('P-200 schedule — Excel')
    const switchSeenAt = rig.clock.now() + TICK_MS // first tick that sees P-200
    await rig.step(1 + DWELL_MS / TICK_MS)

    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(2)
    expect(sessions[0].project_code).toBe('P-100')
    expect(sessions[0].closed_reason).toBe('normal')
    expect(sessions[0].end_ts).toBe(switchSeenAt)
    expect(sessions[1].project_code).toBe('P-200')
    expect(sessions[1].start_ts).toBe(switchSeenAt)
    expect(sessions[1].end_ts).toBeNull()
  })

  it('closes the session (after dwell) when no rule matches', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(7)

    rig.windows.setWindow('Inbox — Outlook')
    await rig.step(1 + DWELL_MS / TICK_MS)

    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].end_ts).not.toBeNull()
    expect(rig.tracker.getTrackerState().status).toBe('no_match')
  })
})

describe('idle handling', () => {
  it('closes the open session backdated to when input stopped', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(100) // ~8 min of tracked work

    rig.idle.idleSeconds = 360 // 6 min idle
    await rig.step()
    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].closed_reason).toBe('idle')
    expect(sessions[0].end_ts).toBe(rig.clock.now() - 360_000)
    expect(rig.tracker.getTrackerState().status).toBe('idle')
  })

  it('resumes tracking after activity returns', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(100)
    rig.idle.idleSeconds = 360
    await rig.step()

    rig.idle.idleSeconds = 0
    await rig.step(7) // dwell again before reopening
    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(2)
    expect(sessions[1].end_ts).toBeNull()
  })
})

describe('manual override', () => {
  it('opens a manual session immediately and ignores window changes', async () => {
    const rig = makeRig()
    rig.tracker.setManualOverride('P-200')

    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(10)

    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].project_code).toBe('P-200')
    expect(sessions[0].source).toBe('manual')
    expect(sessions[0].end_ts).toBeNull()
    expect(rig.tracker.getTrackerState().mode).toBe('manual')
  })

  it('clearing the override returns to auto tracking', async () => {
    const rig = makeRig()
    rig.tracker.setManualOverride('P-200')
    await rig.step(2)
    rig.clock.advance(1000)
    rig.tracker.clearOverride()

    expect(rig.tracker.getTrackerState().mode).toBe('auto')
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(7)
    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(2)
    expect(sessions[1].project_code).toBe('P-100')
    expect(sessions[1].source).toBe('auto')
  })

  it('manual sessions still pause on idle', async () => {
    const rig = makeRig()
    rig.tracker.setManualOverride('P-200')
    await rig.step(130) // ~11 min of manual time
    rig.idle.idleSeconds = 600
    await rig.step()
    const sessions = allSessions(rig.db)
    expect(sessions[0].closed_reason).toBe('idle')
  })
})

describe('lock handling', () => {
  it('closes the session at lock time and stays paused until unlock', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(7)

    rig.idle.fireLock()
    expect(rig.tracker.getTrackerState().status).toBe('locked')
    const afterLock = allSessions(rig.db)
    expect(afterLock[0].closed_reason).toBe('lock')
    expect(afterLock[0].end_ts).toBe(rig.clock.now())

    await rig.step(10) // ticks while locked log nothing
    expect(allSessions(rig.db)).toHaveLength(1)

    rig.idle.fireUnlock()
    await rig.step(7)
    expect(allSessions(rig.db)).toHaveLength(2)
  })
})

describe('drift guard', () => {
  it('deletes sessions whose duration would exceed 24h', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD')
    await rig.step(7)

    rig.clock.advance(25 * 60 * 60 * 1000) // clock jumps 25h
    rig.tracker.shutdown()
    expect(allSessions(rig.db)).toHaveLength(0)
  })
})

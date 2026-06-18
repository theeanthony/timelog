import { describe, expect, it } from 'vitest'
import { DWELL_MS, TICK_MS } from '../src/main/engine/tracker'
import { addRule, addRuleForApp } from '../src/main/db/projects'
import { listUnmatched } from '../src/main/db/unmatched'
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

describe('app-name matching, what-matched & no-match suggestions', () => {
  it('matches on app name when the title alone would not', async () => {
    const rig = makeRig()
    addRule(rig.db, 'P-100', 'Figma', 1, 'app')
    rig.tracker.reloadRules()
    rig.windows.setWindow('Untitled design', 'Figma') // title matches nothing

    await rig.step(1 + DWELL_MS / TICK_MS)
    const sessions = allSessions(rig.db)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].project_code).toBe('P-100')

    const m = rig.tracker.getTrackerState().matchInfo
    expect(m?.by).toBe('app')
    expect(m?.value).toBe('Figma')
  })

  it('reports a title match in matchInfo', async () => {
    const rig = makeRig()
    rig.windows.setWindow('P-100 layout — AutoCAD', 'AutoCAD')
    await rig.step(1 + DWELL_MS / TICK_MS)
    const m = rig.tracker.getTrackerState().matchInfo
    expect(m?.by).toBe('title')
    expect(m?.value).toBe('P-100 layout — AutoCAD')
  })

  it('records an unmatched window and suggests a project by app-name overlap', async () => {
    const rig = makeRig()
    rig.windows.setWindow('weekly notes', 'P-100 Helper') // no title rule hits
    await rig.step(1 + DWELL_MS / TICK_MS)

    const state = rig.tracker.getTrackerState()
    expect(state.status).toBe('no_match')
    expect(state.suggestedProjectCode).toBe('P-100') // app name contains the code
    expect(state.matchInfo).toBeNull()

    const rows = listUnmatched(rig.db)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ app: 'P-100 Helper', title: 'weekly notes' })
  })

  it('teaching an app makes its windows auto-match', async () => {
    const rig = makeRig()
    addRuleForApp(rig.db, 'P-200', 'Slack')
    rig.tracker.reloadRules()
    rig.windows.setWindow('general channel', 'Slack')
    await rig.step(1 + DWELL_MS / TICK_MS)
    const sessions = allSessions(rig.db)
    expect(sessions[0].project_code).toBe('P-200')
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

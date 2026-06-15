import type { TrackerState } from '../../shared/types'
import type { Clock, IdleSource, WindowSource } from '../platform/types'
import type { Db } from '../db/database'
import { KEYS, getState, setState } from '../db/app-state'
import { getProject, listEnabledRules, listProjects } from '../db/projects'
import { closeSession, getOpenSession, openSession, totalsByProject } from '../db/sessions'
import { listPendingIdle, recordIdleEvent } from '../db/idle-events'
import { getPrefs } from '../prefs'
import { compileRules, matchTitle, type CompiledRule } from './rules'

export const TICK_MS = 5_000
export const DWELL_MS = 30_000
export const IDLE_SECONDS = 300
export const HEARTBEAT_EVERY_TICKS = 6

export interface TrackerDeps {
  db: Db
  windowSource: WindowSource
  idleSource: IdleSource
  clock: Clock
  onState?: (state: TrackerState) => void
}

/**
 * The tick-driven tracking state machine. It owns no timers — the caller
 * invokes tick() every TICK_MS (real loop in main, manual calls in tests).
 * All durations derive from wall-clock timestamps in the sessions table,
 * never from accumulated tick counts.
 */
export class Tracker {
  private readonly db: Db
  private readonly windowSource: WindowSource
  private readonly idleSource: IdleSource
  private readonly clock: Clock
  private readonly onState?: (state: TrackerState) => void

  private rules: CompiledRule[] = []
  private locked = false
  private idle = false
  private lastWindowTitle = ''
  private permissionDenied = false
  /** Pending project change: code (or null = no-match) and when it was first seen. */
  private candidate: { code: string | null; since: number } | null = null
  /** While idle: the project + gap-start so the return can be offered for review. */
  private idleSince: { projectCode: string | null; startTs: number } | null = null
  private tickCount = 0

  constructor(deps: TrackerDeps) {
    this.db = deps.db
    this.windowSource = deps.windowSource
    this.idleSource = deps.idleSource
    this.clock = deps.clock
    this.onState = deps.onState

    this.reloadRules()
    this.idleSource.onLock(() => this.handleLock())
    this.idleSource.onUnlock(() => this.handleUnlock())
  }

  reloadRules(): void {
    this.rules = compileRules(listEnabledRules(this.db))
  }

  /** Push current state to the renderer — call after out-of-band DB edits. */
  refresh(): void {
    this.pushState()
  }

  /** Privacy preference: 'manual' means the window source is never invoked. */
  get trackingMode(): 'auto' | 'manual' {
    return getState(this.db, KEYS.trackingMode) === 'manual' ? 'manual' : 'auto'
  }

  get mode(): 'auto' | 'manual' {
    if (this.trackingMode === 'manual') return 'manual'
    return getState(this.db, KEYS.mode) === 'manual' ? 'manual' : 'auto'
  }

  private get manualProjectCode(): string | null {
    return getState(this.db, KEYS.manualProjectCode)
  }

  /** Idle threshold in seconds — user-tunable, defaults to IDLE_SECONDS. */
  private get idleThresholdSeconds(): number {
    return getPrefs(this.db).idleTimeoutSec
  }

  /** Dwell before committing an auto switch — user-tunable, defaults to DWELL_MS. */
  private get dwellMs(): number {
    return getPrefs(this.db).dwellSec * 1000
  }

  async tick(): Promise<void> {
    const now = this.clock.now()
    this.tickCount++

    if (!this.locked) {
      const idleSeconds = this.idleSource.getIdleSeconds()
      if (idleSeconds >= this.idleThresholdSeconds) {
        this.enterIdle(now, idleSeconds)
      } else {
        if (this.idle) this.finishIdle(now)
        this.idle = false
        if (this.mode === 'manual') {
          // Covers both the override within auto tracking and manual-only
          // tracking mode; neither path ever reads a window title.
          this.ensureManualSession(now)
        } else {
          await this.autoTick(now)
        }
      }
    }

    if (this.tickCount % HEARTBEAT_EVERY_TICKS === 0 || this.tickCount === 1) {
      setState(this.db, KEYS.heartbeatTs, String(now))
    }
    this.pushState()
  }

  private enterIdle(now: number, idleSeconds: number): void {
    const open = getOpenSession(this.db)
    if (open) {
      // Backdate the close to when input actually stopped.
      const endTs = Math.max(open.startTs, now - idleSeconds * 1000)
      closeSession(this.db, open.id, endTs, 'idle')
      // Remember the gap so the user can review it on return (first entry only).
      if (!this.idle) this.idleSince = { projectCode: open.projectCode, startTs: endTs }
    }
    this.idle = true
    this.candidate = null
  }

  /** Activity returned: log the idle gap for review if it covered real work. */
  private finishIdle(now: number): void {
    const since = this.idleSince
    this.idleSince = null
    if (since?.projectCode && now > since.startTs) {
      recordIdleEvent(this.db, since.projectCode, since.startTs, now)
    }
  }

  private ensureManualSession(now: number): void {
    const code = this.manualProjectCode
    if (!code) return
    const open = getOpenSession(this.db)
    if (open && open.projectCode === code && open.source === 'manual') return
    if (open) closeSession(this.db, open.id, now, 'normal')
    openSession(this.db, code, now, 'manual')
  }

  private async autoTick(now: number): Promise<void> {
    const info = await this.windowSource.getActiveWindow()
    this.lastWindowTitle = info?.title ?? ''

    if (info !== null && info.title === '') {
      // Empty titles with denied permission means we can't see anything —
      // surface a hint instead of silently logging no-match (macOS dev).
      this.permissionDenied = (await this.windowSource.checkPermission()) === 'denied'
    } else if (info !== null) {
      this.permissionDenied = false
    }

    const matched = info ? matchTitle(this.rules, info.title) : null
    const open = getOpenSession(this.db)
    const current = open ? open.projectCode : null

    if (matched === current) {
      this.candidate = null
      return
    }

    // Project change (or change to/from no-match): commit only after dwell.
    if (!this.candidate || this.candidate.code !== matched) {
      this.candidate = { code: matched, since: now }
      return
    }
    if (now - this.candidate.since < this.dwellMs) return

    const switchTs = this.candidate.since
    this.candidate = null
    if (open) closeSession(this.db, open.id, switchTs, 'normal')
    // Backdate the new session to when the new window was first seen, so the
    // dwell window credits the project actually being worked on.
    if (matched) openSession(this.db, matched, switchTs, 'auto')
  }

  private handleLock(): void {
    const now = this.clock.now()
    const open = getOpenSession(this.db)
    if (open) closeSession(this.db, open.id, now, 'lock')
    this.locked = true
    this.candidate = null
    // Locked time isn't offered for idle review.
    this.idle = false
    this.idleSince = null
    this.pushState()
  }

  private handleUnlock(): void {
    this.locked = false
    this.pushState()
  }

  setManualOverride(code: string): void {
    const now = this.clock.now()
    const open = getOpenSession(this.db)
    if (open) closeSession(this.db, open.id, now, 'normal')
    setState(this.db, KEYS.mode, 'manual')
    setState(this.db, KEYS.manualProjectCode, code)
    openSession(this.db, code, now, 'manual')
    this.candidate = null
    this.pushState()
  }

  /**
   * In auto tracking mode: release the override and resume auto tracking.
   * In manual tracking mode: check out (stop the clock, stay manual).
   */
  clearOverride(): void {
    const now = this.clock.now()
    const open = getOpenSession(this.db)
    if (open) closeSession(this.db, open.id, now, 'normal')
    setState(this.db, KEYS.mode, 'auto')
    setState(this.db, KEYS.manualProjectCode, '')
    this.candidate = null
    this.pushState()
  }

  setTrackingMode(trackingMode: 'auto' | 'manual'): void {
    if (trackingMode === this.trackingMode) return
    const now = this.clock.now()
    const open = getOpenSession(this.db)
    if (open) closeSession(this.db, open.id, now, 'normal')
    setState(this.db, KEYS.trackingMode, trackingMode)
    // Start fresh in the new mode: no override, checked out.
    setState(this.db, KEYS.mode, 'auto')
    setState(this.db, KEYS.manualProjectCode, '')
    this.candidate = null
    this.pushState()
  }

  getTrackerState(): TrackerState {
    const open = getOpenSession(this.db)
    const now = this.clock.now()
    const dayStart = startOfLocalDay(now)

    let status: TrackerState['status'] = 'tracking'
    if (this.locked) status = 'locked'
    else if (this.idle && (this.mode === 'auto' || this.manualProjectCode)) status = 'idle'
    else if (this.trackingMode === 'manual') status = open ? 'tracking' : 'checked_out'
    // Permission only matters in auto mode; manual tracking never reads titles.
    else if (this.permissionDenied && this.mode === 'auto') status = 'permission_needed'
    else if (!open) status = 'no_match'

    const activeCode = open?.projectCode ?? (this.mode === 'manual' ? this.manualProjectCode : null)

    return {
      mode: this.mode,
      trackingMode: this.trackingMode,
      status,
      activeProject: activeCode ? getProject(this.db, activeCode) : null,
      openSessionStartTs: open?.startTs ?? null,
      todayMsByProject: totalsByProject(this.db, dayStart, now),
      lastWindowTitle: this.lastWindowTitle,
      setupComplete: getState(this.db, KEYS.setupComplete) === '1',
      pendingIdle: listPendingIdle(this.db)
    }
  }

  /** Close any open session cleanly (app quit). */
  shutdown(): void {
    const open = getOpenSession(this.db)
    if (open) closeSession(this.db, open.id, this.clock.now(), 'normal')
  }

  private pushState(): void {
    this.onState?.(this.getTrackerState())
  }

  // Exposed so tests and the projects list can reuse the same view of the db.
  listProjects(): ReturnType<typeof listProjects> {
    return listProjects(this.db)
  }
}

export function startOfLocalDay(epochMs: number): number {
  const d = new Date(epochMs)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

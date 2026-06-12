import { openDatabase, type Db } from '../src/main/db/database'
import { addProject } from '../src/main/db/projects'
import { Tracker, TICK_MS } from '../src/main/engine/tracker'
import type { ActiveWindowInfo, Clock, IdleSource, WindowSource } from '../src/main/platform/types'

export const T0 = 1_750_000_000_000 // fixed epoch for deterministic tests

export class FakeClock implements Clock {
  constructor(public t: number = T0) {}
  now(): number {
    return this.t
  }
  advance(ms: number): void {
    this.t += ms
  }
}

export class FakeWindowSource implements WindowSource {
  current: ActiveWindowInfo | null = null
  permission: 'granted' | 'denied' = 'granted'
  /** Number of times the tracker actually read the active window. */
  reads = 0
  async getActiveWindow(): Promise<ActiveWindowInfo | null> {
    this.reads++
    return this.current
  }
  async checkPermission(): Promise<'granted' | 'denied' | 'unknown'> {
    return this.permission
  }
  setWindow(title: string, appName = 'TestApp'): void {
    this.current = { title, appName }
  }
}

export class FakeIdleSource implements IdleSource {
  idleSeconds = 0
  private lockCbs: Array<() => void> = []
  private unlockCbs: Array<() => void> = []
  getIdleSeconds(): number {
    return this.idleSeconds
  }
  onLock(cb: () => void): void {
    this.lockCbs.push(cb)
  }
  onUnlock(cb: () => void): void {
    this.unlockCbs.push(cb)
  }
  fireLock(): void {
    this.lockCbs.forEach((cb) => cb())
  }
  fireUnlock(): void {
    this.unlockCbs.forEach((cb) => cb())
  }
}

export interface Rig {
  db: Db
  clock: FakeClock
  windows: FakeWindowSource
  idle: FakeIdleSource
  tracker: Tracker
  /** Advance the clock by one tick interval and run a tick. */
  step(n?: number): Promise<void>
}

export function makeRig(opts: { trackingMode?: 'auto' | 'manual' } = {}): Rig {
  const db = openDatabase(':memory:')
  addProject(db, { code: 'P-100', label: 'Substation Alpha', color: '#5B8DEF' }, T0 - 1000)
  addProject(db, { code: 'P-200', label: 'Feeder Beta', color: '#43B97F' }, T0 - 1000)
  if (opts.trackingMode === 'manual') {
    db.prepare(`INSERT INTO app_state (key, value) VALUES ('tracking_mode', 'manual')`).run()
  }

  const clock = new FakeClock()
  const windows = new FakeWindowSource()
  const idle = new FakeIdleSource()
  const tracker = new Tracker({ db, windowSource: windows, idleSource: idle, clock })

  const step = async (n = 1): Promise<void> => {
    for (let i = 0; i < n; i++) {
      clock.advance(TICK_MS)
      await tracker.tick()
    }
  }
  return { db, clock, windows, idle, tracker, step }
}

export function allSessions(db: Db): Array<Record<string, unknown>> {
  return db.prepare('SELECT * FROM sessions ORDER BY id').all() as Array<Record<string, unknown>>
}

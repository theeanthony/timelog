export interface ActiveWindowInfo {
  title: string
  /** Owner process/app name, e.g. 'Code', 'EXCEL'. */
  appName: string
}

export interface WindowSource {
  /** null = no active window or title unavailable. */
  getActiveWindow(): Promise<ActiveWindowInfo | null>
  /** macOS needs Screen Recording permission to read other apps' titles. */
  checkPermission(): Promise<'granted' | 'denied' | 'unknown'>
}

export interface IdleSource {
  getIdleSeconds(): number
  onLock(cb: () => void): void
  onUnlock(cb: () => void): void
}

export interface Clock {
  /** Epoch milliseconds. Injectable so tests can drive time manually. */
  now(): number
}

export const systemClock: Clock = { now: () => Date.now() }

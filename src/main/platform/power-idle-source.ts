import { powerMonitor } from 'electron'
import type { IdleSource } from './types'

/** Idle + lock detection via Electron's powerMonitor. Suspend counts as lock. */
export class PowerIdleSource implements IdleSource {
  getIdleSeconds(): number {
    return powerMonitor.getSystemIdleTime()
  }

  onLock(cb: () => void): void {
    powerMonitor.on('lock-screen', cb)
    powerMonitor.on('suspend', cb)
  }

  onUnlock(cb: () => void): void {
    powerMonitor.on('unlock-screen', cb)
    powerMonitor.on('resume', cb)
  }
}

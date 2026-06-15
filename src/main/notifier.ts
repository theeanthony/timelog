import { Notification } from 'electron'
import type { TrackerState } from '../shared/types'
import type { Db } from './db/database'
import type { Clock } from './platform/types'
import { getPrefs } from './prefs'
import { totalsByProject } from './db/sessions'
import { startOfLocalDay } from './engine/tracker'
import { formatShort } from '../shared/format'

/**
 * Optional, dismissible desktop nudges driven by tracker state. All gated by
 * prefs; nothing fires unless the user opted in. Pure side-effects — never
 * touches the database except to read prefs and compute the daily total.
 */
export class Notifier {
  private lastStatus: TrackerState['status'] | null = null
  private longRunNotifiedFor: number | null = null
  private dailyNotifiedDay: number | null = null

  constructor(
    private readonly db: Db,
    private readonly clock: Clock
  ) {}

  onState(state: TrackerState): void {
    const prefs = getPrefs(this.db)

    if (prefs.notifyIdle && state.status === 'idle' && this.lastStatus !== 'idle') {
      this.notify('Timer paused', 'You went idle — time has stopped accruing.')
    }

    if (prefs.notifyLongRun && state.openSessionStartTs !== null && state.activeProject) {
      const elapsed = this.clock.now() - state.openSessionStartTs
      const threshold = prefs.longRunHours * 3_600_000
      if (elapsed >= threshold && this.longRunNotifiedFor !== state.openSessionStartTs) {
        this.longRunNotifiedFor = state.openSessionStartTs
        this.notify(
          'Still tracking?',
          `${state.activeProject.code} has been running for ${formatShort(elapsed)}.`
        )
      }
    } else if (state.openSessionStartTs === null) {
      this.longRunNotifiedFor = null
    }

    this.lastStatus = state.status
  }

  /** Call periodically; fires the end-of-day summary once at the chosen hour. */
  checkDaily(): void {
    const prefs = getPrefs(this.db)
    if (!prefs.notifyDailySummary) return
    const now = this.clock.now()
    const dayStart = startOfLocalDay(now)
    const hour = new Date(now).getHours()
    if (hour < prefs.dailySummaryHour || this.dailyNotifiedDay === dayStart) return

    this.dailyNotifiedDay = dayStart
    const totals = totalsByProject(this.db, dayStart, now)
    const totalMs = Object.values(totals).reduce((a, b) => a + b, 0)
    if (totalMs <= 0) return
    this.notify('Today so far', `${formatShort(totalMs)} logged. Export when you're done.`)
  }

  private notify(title: string, body: string): void {
    if (!Notification.isSupported()) return
    new Notification({ title, body, silent: true }).show()
  }
}

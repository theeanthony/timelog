export interface Project {
  code: string
  label: string
  color: string
  createdAt: number
}

export interface Rule {
  id: number
  projectCode: string
  pattern: string
  priority: number
  enabled: boolean
}

export type SessionSource = 'auto' | 'manual'
export type ClosedReason = 'normal' | 'crash_recovery' | 'idle' | 'lock'

export interface Session {
  id: number
  projectCode: string
  startTs: number
  endTs: number | null
  source: SessionSource
  closedReason: ClosedReason | null
}

export type TrackerMode = 'auto' | 'manual'
export type TrackerStatus = 'tracking' | 'idle' | 'no_match' | 'locked' | 'permission_needed'

export interface TrackerState {
  mode: TrackerMode
  status: TrackerStatus
  activeProject: Project | null
  openSessionStartTs: number | null
  /** Closed-session totals for today, keyed by project code (ms). */
  todayMsByProject: Record<string, number>
  lastWindowTitle: string
  setupComplete: boolean
}

export interface WeekTotalRow {
  code: string
  label: string
  hours: number
  minutes: number
  totalMs: number
}

export interface WeekTotals {
  weekStartIso: string
  rows: WeekTotalRow[]
}

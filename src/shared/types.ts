export interface Project {
  code: string
  label: string
  color: string
  createdAt: number
  /** Hidden from the main list but its sessions/totals are preserved. */
  archived: boolean
  /** Manual ordering for the project list (lower = higher). */
  sortOrder: number
  /** Pinned projects sort above unpinned ones. */
  pinned: boolean
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
/** How tracking works at all: passive window-title polling, or manual check-in only (no window reads ever). */
export type TrackingMode = 'auto' | 'manual'
export type TrackerStatus =
  | 'tracking'
  | 'idle'
  | 'no_match'
  | 'locked'
  | 'permission_needed'
  | 'checked_out'

export interface TrackerState {
  mode: TrackerMode
  trackingMode: TrackingMode
  status: TrackerStatus
  activeProject: Project | null
  openSessionStartTs: number | null
  /** Closed-session totals for today, keyed by project code (ms). */
  todayMsByProject: Record<string, number>
  lastWindowTitle: string
  setupComplete: boolean
  /** Unresolved idle gaps awaiting keep/discard/reassign. */
  pendingIdle: IdleEvent[]
}

/**
 * An idle gap captured when the user returns from being idle. The tracker
 * already excluded this time; the review lets them add it back (keep/reassign)
 * or confirm the discard.
 */
export interface IdleEvent {
  id: number
  projectCode: string
  gapStartTs: number
  gapEndTs: number
}

/** A user-uploaded pet sprite (sanitized SVG markup + its default colors). */
export interface CustomPet {
  id: string
  name: string
  /** Sanitized inline SVG markup (no scripts / event handlers / external refs). */
  svg: string
  /** Body colour (the sprite's `currentColor`). */
  body: string
  accent: string
  eye: string
}

/** User-configurable preferences. Persisted as individual app_state rows. */
export interface Prefs {
  idleTimeoutSec: number
  dwellSec: number
  launchAtLogin: boolean
  alwaysOnTop: boolean
  /** Theme id: 'dark' | 'light' | 'system' | a preset id | 'custom'. */
  theme: string
  /** Per-variable overrides for the 'custom' theme; `__base` picks light/dark. */
  customColors: Record<string, string>
  notifyIdle: boolean
  notifyLongRun: boolean
  longRunHours: number
  notifyDailySummary: boolean
  dailySummaryHour: number
  globalShortcut: string
  /** Whether pet companions are shown at all. */
  petsEnabled: boolean
  /** Ordered party of 1–3 pet ids; duplicates allowed (e.g. ['cat','cat']). */
  pets: string[]
  /** User-uploaded pets, selectable alongside the built-ins. */
  customPets: CustomPet[]
}

export const DEFAULT_PREFS: Prefs = {
  idleTimeoutSec: 300,
  dwellSec: 30,
  launchAtLogin: false,
  alwaysOnTop: true,
  theme: 'dark',
  customColors: {},
  notifyIdle: true,
  notifyLongRun: true,
  longRunHours: 4,
  notifyDailySummary: false,
  dailySummaryHour: 17,
  globalShortcut: 'CommandOrControl+Shift+T',
  petsEnabled: true,
  pets: ['cat'],
  customPets: []
}

export interface AppInfo {
  version: string
  platform: string
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

export interface DayBreakdown {
  dateIso: string
  msByProject: Record<string, number>
  totalMs: number
}

export interface WeekBreakdown {
  weekStartIso: string
  /** Always 7 entries, Monday first. */
  days: DayBreakdown[]
}

export type RangeUnit = 'week' | 'month'

/** A generic day-bucketed breakdown for an arbitrary span (week or month). */
export interface RangeBreakdown {
  unit: RangeUnit
  startIso: string
  /** One entry per day in the span, in order. */
  days: DayBreakdown[]
  /** Per-project totals across the whole span (ms), descending. */
  totals: WeekTotalRow[]
}

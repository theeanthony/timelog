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

/** Which part of the active window a rule's pattern is tested against. */
export type RuleField = 'title' | 'app' | 'any'

export interface Rule {
  id: number
  projectCode: string
  pattern: string
  priority: number
  enabled: boolean
  /** Signal the pattern matches: window title, app name, or either. */
  field: RuleField
}

/** A window observed in auto mode that matched no rule — surfaced for review. */
export interface UnmatchedWindow {
  app: string
  title: string
  lastSeen: number
  seenCount: number
}

/** How the current auto-tracked session was matched (for transparency in the UI). */
export interface MatchInfo {
  /** Which signal fired the matching rule. */
  by: 'app' | 'title'
  /** The text that matched (the app name or the window title). */
  value: string
  ruleId: number
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

/** Floating-panel view: full panel, minimized bar, or hover-peek. */
export type PanelView = 'full' | 'compact' | 'peek'

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
  /** App name of the current foreground window (auto mode), for teach/suggest. */
  lastAppName: string
  /** How the current auto session matched, or null (no-match / manual / idle). */
  matchInfo: MatchInfo | null
  /** Best-guess project for the current no-match window, or null. */
  suggestedProjectCode: string | null
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

/** Rarity tier of a collectible sprite (drives drop weights + visual treatment). */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

/** Optional coat pattern overlay applied on top of a species. */
export type SpritePattern = 'spots' | 'stripes' | 'patch'

/** Optional worn accessory overlay. */
export type SpriteAccessory = 'scarf' | 'cap' | 'glasses'

/** How a species moves about the panel: walks the floor, swims, or flies. */
export type Locomotion = 'walk' | 'swim' | 'fly'

/** The biome a species lives in; also how the Zoo is grouped. */
export type Habitat =
  | 'home'
  | 'city'
  | 'forest'
  | 'jungle'
  | 'grassland'
  | 'desert'
  | 'wetland'
  | 'swamp'
  | 'mountain'
  | 'cave'
  | 'volcano'
  | 'tundra'
  | 'ocean'
  | 'sky'

/**
 * A collectible critter — a *recipe* over a base species, not a drawn asset.
 * A small roster of hand-drawn species combined with palette / pattern /
 * accessory / shiny variation yields thousands of distinct collectibles.
 * `seed` is the DNA: the dedupe key and the basis of a shareable trade code.
 */
export interface SpriteVariant {
  /** Base species id (matches a Species / PetDef id). */
  species: string
  habitat: Habitat
  /** The three themeable SVG colour channels. */
  palette: { body: string; accent: string; eye: string }
  pattern?: SpritePattern
  accessory?: SpriteAccessory
  shiny?: boolean
  rarity: Rarity
  /** Deterministic DNA; dedupe key + trade-code basis. */
  seed: string
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
  /** Imported / traded critters merged into the zoo on top of earned ones. */
  collection: SpriteVariant[]
  /** Active companion critters shown on the panel (1–3); empty falls back to `pets`. */
  party: SpriteVariant[]
  /** Per-install seed so the earned collection hatches consistently. */
  spriteSalt: string
  /** Active habitat backdrop shown on the panel. */
  activeHabitat: Habitat
  /** Forced time-of-day hour (0–23) for habitat lighting, or null to follow the clock. */
  dayNightHour: number | null
  /** Show the living diorama (roaming residents + props + events) behind the panel. */
  dioramaOnPanel: boolean
  /** Scales the diorama's resident/prop liveliness (0.5 calm – 1.5 busy). */
  dioramaDensity: number
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
  customPets: [],
  collection: [],
  party: [],
  spriteSalt: '',
  activeHabitat: 'home',
  dayNightHour: null,
  dioramaOnPanel: true,
  dioramaDensity: 1
}

export interface AppInfo {
  version: string
  platform: string
}

/** Auto-update lifecycle, pushed main→renderer and shown by the updates UI. */
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'dev' } // running unpackaged — updates only work in installed builds
  | { state: 'unsupported' } // platform/target can't auto-update (e.g. portable)
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'up-to-date'; version: string }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; message: string }

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

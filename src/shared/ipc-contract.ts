import type {
  AppInfo,
  Prefs,
  Project,
  RangeBreakdown,
  RangeUnit,
  Rule,
  Session,
  TrackerState,
  TrackingMode,
  WeekBreakdown,
  WeekTotals
} from './types'

export const IPC = {
  // main → renderer push
  stateUpdate: 'state:update',
  // renderer → main commands
  getState: 'tracker:getState',
  setManualOverride: 'tracker:setManualOverride',
  clearOverride: 'tracker:clearOverride',
  setTrackingMode: 'tracker:setTrackingMode',
  listProjects: 'projects:list',
  addProject: 'projects:add',
  updateProject: 'projects:update',
  renameProject: 'projects:rename',
  archiveProject: 'projects:archive',
  setProjectPinned: 'projects:setPinned',
  reorderProjects: 'projects:reorder',
  deleteProject: 'projects:delete',
  listRules: 'rules:list',
  addRule: 'rules:add',
  addRuleForTitle: 'rules:addForTitle',
  updateRule: 'rules:update',
  deleteRule: 'rules:delete',
  listDaySessions: 'sessions:listDay',
  reassignSession: 'sessions:reassign',
  deleteSession: 'sessions:delete',
  addManualSession: 'sessions:addManual',
  splitSession: 'sessions:split',
  keepIdle: 'idle:keep',
  discardIdle: 'idle:discard',
  reassignIdle: 'idle:reassign',
  getPrefs: 'prefs:get',
  setPrefs: 'prefs:set',
  getAppInfo: 'app:info',
  completeSetup: 'setup:complete',
  getWeekTotals: 'export:weekTotals',
  getWeekBreakdown: 'export:weekBreakdown',
  getRangeBreakdown: 'export:rangeBreakdown',
  exportWeekCsv: 'export:saveCsv',
  copyWeekCsv: 'export:copyCsv',
  exportRangeCsv: 'export:saveRangeCsv',
  copyRangeCsv: 'export:copyRangeCsv'
} as const

export interface NewProject {
  code: string
  label: string
  color: string
}

export type ExportResult = { savedTo: string } | { canceled: true }

/** API surface exposed on window.timelog via the preload contextBridge. */
export interface TimelogApi {
  getState(): Promise<TrackerState>
  onState(cb: (s: TrackerState) => void): () => void
  setManualOverride(code: string): Promise<void>
  clearOverride(): Promise<void>
  setTrackingMode(mode: TrackingMode): Promise<void>

  listProjects(includeArchived?: boolean): Promise<Project[]>
  addProject(p: NewProject): Promise<void>
  updateProject(code: string, patch: { label?: string; color?: string }): Promise<void>
  renameProject(oldCode: string, newCode: string): Promise<{ ok: true } | { error: string }>
  archiveProject(code: string, archived: boolean): Promise<void>
  setProjectPinned(code: string, pinned: boolean): Promise<void>
  reorderProjects(codes: string[]): Promise<void>
  deleteProject(code: string, reassignTo?: string): Promise<void>

  listRules(projectCode?: string): Promise<Rule[]>
  addRule(projectCode: string, pattern: string, priority?: number): Promise<number>
  addRuleForTitle(projectCode: string, title: string): Promise<number>
  updateRule(
    id: number,
    patch: { pattern?: string; priority?: number; enabled?: boolean }
  ): Promise<void>
  deleteRule(id: number): Promise<void>

  listDaySessions(dayStartTs: number): Promise<Session[]>
  reassignSession(id: number, code: string): Promise<void>
  deleteSession(id: number): Promise<void>
  addManualSession(code: string, startTs: number, endTs: number): Promise<number | null>
  splitSession(id: number, atTs: number): Promise<number | null>

  keepIdle(id: number): Promise<void>
  discardIdle(id: number): Promise<void>
  reassignIdle(id: number, code: string): Promise<void>

  getPrefs(): Promise<Prefs>
  setPrefs(patch: Partial<Prefs>): Promise<Prefs>
  getAppInfo(): Promise<AppInfo>

  completeSetup(trackingMode: TrackingMode): Promise<void>
  getWeekTotals(weekStartIso: string): Promise<WeekTotals>
  getWeekBreakdown(weekStartIso: string): Promise<WeekBreakdown>
  getRangeBreakdown(unit: RangeUnit, startIso: string, numDays: number): Promise<RangeBreakdown>
  exportWeekCsv(weekStartIso: string): Promise<ExportResult>
  copyWeekCsv(weekStartIso: string): Promise<void>
  exportRangeCsv(unit: RangeUnit, startIso: string, numDays: number): Promise<ExportResult>
  copyRangeCsv(unit: RangeUnit, startIso: string, numDays: number): Promise<void>
}

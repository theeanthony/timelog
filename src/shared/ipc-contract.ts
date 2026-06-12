import type { Project, TrackerState, TrackingMode, WeekBreakdown, WeekTotals } from './types'

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
  completeSetup: 'setup:complete',
  getWeekTotals: 'export:weekTotals',
  getWeekBreakdown: 'export:weekBreakdown',
  exportWeekCsv: 'export:saveCsv',
  copyWeekCsv: 'export:copyCsv'
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
  listProjects(): Promise<Project[]>
  addProject(p: NewProject): Promise<void>
  completeSetup(trackingMode: TrackingMode): Promise<void>
  getWeekTotals(weekStartIso: string): Promise<WeekTotals>
  getWeekBreakdown(weekStartIso: string): Promise<WeekBreakdown>
  exportWeekCsv(weekStartIso: string): Promise<ExportResult>
  copyWeekCsv(weekStartIso: string): Promise<void>
}

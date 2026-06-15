import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type NewProject, type TimelogApi } from '../shared/ipc-contract'
import type { Prefs, RangeUnit, TrackerState, TrackingMode } from '../shared/types'

const api: TimelogApi = {
  getState: () => ipcRenderer.invoke(IPC.getState),
  onState: (cb) => {
    const listener = (_e: Electron.IpcRendererEvent, state: TrackerState): void => cb(state)
    ipcRenderer.on(IPC.stateUpdate, listener)
    return () => ipcRenderer.removeListener(IPC.stateUpdate, listener)
  },
  setManualOverride: (code) => ipcRenderer.invoke(IPC.setManualOverride, code),
  clearOverride: () => ipcRenderer.invoke(IPC.clearOverride),
  setTrackingMode: (mode: TrackingMode) => ipcRenderer.invoke(IPC.setTrackingMode, mode),

  listProjects: (includeArchived) => ipcRenderer.invoke(IPC.listProjects, includeArchived),
  addProject: (p: NewProject) => ipcRenderer.invoke(IPC.addProject, p),
  updateProject: (code, patch) => ipcRenderer.invoke(IPC.updateProject, code, patch),
  renameProject: (oldCode, newCode) => ipcRenderer.invoke(IPC.renameProject, oldCode, newCode),
  archiveProject: (code, archived) => ipcRenderer.invoke(IPC.archiveProject, code, archived),
  setProjectPinned: (code, pinned) => ipcRenderer.invoke(IPC.setProjectPinned, code, pinned),
  reorderProjects: (codes) => ipcRenderer.invoke(IPC.reorderProjects, codes),
  deleteProject: (code, reassignTo) => ipcRenderer.invoke(IPC.deleteProject, code, reassignTo),

  listRules: (projectCode) => ipcRenderer.invoke(IPC.listRules, projectCode),
  addRule: (projectCode, pattern, priority) =>
    ipcRenderer.invoke(IPC.addRule, projectCode, pattern, priority),
  addRuleForTitle: (projectCode, title) =>
    ipcRenderer.invoke(IPC.addRuleForTitle, projectCode, title),
  updateRule: (id, patch) => ipcRenderer.invoke(IPC.updateRule, id, patch),
  deleteRule: (id) => ipcRenderer.invoke(IPC.deleteRule, id),

  listDaySessions: (dayStartTs) => ipcRenderer.invoke(IPC.listDaySessions, dayStartTs),
  reassignSession: (id, code) => ipcRenderer.invoke(IPC.reassignSession, id, code),
  deleteSession: (id) => ipcRenderer.invoke(IPC.deleteSession, id),
  addManualSession: (code, startTs, endTs) =>
    ipcRenderer.invoke(IPC.addManualSession, code, startTs, endTs),
  splitSession: (id, atTs) => ipcRenderer.invoke(IPC.splitSession, id, atTs),

  keepIdle: (id) => ipcRenderer.invoke(IPC.keepIdle, id),
  discardIdle: (id) => ipcRenderer.invoke(IPC.discardIdle, id),
  reassignIdle: (id, code) => ipcRenderer.invoke(IPC.reassignIdle, id, code),

  getPrefs: () => ipcRenderer.invoke(IPC.getPrefs),
  setPrefs: (patch: Partial<Prefs>) => ipcRenderer.invoke(IPC.setPrefs, patch),
  getAppInfo: () => ipcRenderer.invoke(IPC.getAppInfo),

  completeSetup: (trackingMode: TrackingMode) =>
    ipcRenderer.invoke(IPC.completeSetup, trackingMode),
  getWeekTotals: (weekStartIso) => ipcRenderer.invoke(IPC.getWeekTotals, weekStartIso),
  getWeekBreakdown: (weekStartIso) => ipcRenderer.invoke(IPC.getWeekBreakdown, weekStartIso),
  getRangeBreakdown: (unit: RangeUnit, startIso, numDays) =>
    ipcRenderer.invoke(IPC.getRangeBreakdown, unit, startIso, numDays),
  exportWeekCsv: (weekStartIso) => ipcRenderer.invoke(IPC.exportWeekCsv, weekStartIso),
  copyWeekCsv: (weekStartIso) => ipcRenderer.invoke(IPC.copyWeekCsv, weekStartIso),
  exportRangeCsv: (unit: RangeUnit, startIso, numDays) =>
    ipcRenderer.invoke(IPC.exportRangeCsv, unit, startIso, numDays),
  copyRangeCsv: (unit: RangeUnit, startIso, numDays) =>
    ipcRenderer.invoke(IPC.copyRangeCsv, unit, startIso, numDays)
}

/** Fired by the tray's "Export week…" / "Settings…" menu items. */
function onMenuEvent(channel: 'export:openDialog' | 'settings:open', cb: () => void): () => void {
  const listener = (): void => cb()
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('timelog', api)
contextBridge.exposeInMainWorld('timelogEvents', {
  onOpenExportDialog: (cb: () => void) => onMenuEvent('export:openDialog', cb),
  onOpenSettings: (cb: () => void) => onMenuEvent('settings:open', cb)
})

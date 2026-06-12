import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type NewProject, type TimelogApi } from '../shared/ipc-contract'
import type { TrackerState, TrackingMode } from '../shared/types'

const api: TimelogApi = {
  getState: () => ipcRenderer.invoke(IPC.getState),
  onState: (cb) => {
    const listener = (_e: Electron.IpcRendererEvent, state: TrackerState): void => cb(state)
    ipcRenderer.on(IPC.stateUpdate, listener)
    return () => ipcRenderer.removeListener(IPC.stateUpdate, listener)
  },
  setManualOverride: (code: string) => ipcRenderer.invoke(IPC.setManualOverride, code),
  clearOverride: () => ipcRenderer.invoke(IPC.clearOverride),
  setTrackingMode: (mode: TrackingMode) => ipcRenderer.invoke(IPC.setTrackingMode, mode),
  listProjects: () => ipcRenderer.invoke(IPC.listProjects),
  addProject: (p: NewProject) => ipcRenderer.invoke(IPC.addProject, p),
  completeSetup: (trackingMode: TrackingMode) =>
    ipcRenderer.invoke(IPC.completeSetup, trackingMode),
  getWeekTotals: (weekStartIso: string) => ipcRenderer.invoke(IPC.getWeekTotals, weekStartIso),
  getWeekBreakdown: (weekStartIso: string) =>
    ipcRenderer.invoke(IPC.getWeekBreakdown, weekStartIso),
  exportWeekCsv: (weekStartIso: string) => ipcRenderer.invoke(IPC.exportWeekCsv, weekStartIso),
  copyWeekCsv: (weekStartIso: string) => ipcRenderer.invoke(IPC.copyWeekCsv, weekStartIso)
}

/** Fired by the tray's "Export week…" menu item. */
function onOpenExportDialog(cb: () => void): () => void {
  const listener = (): void => cb()
  ipcRenderer.on('export:openDialog', listener)
  return () => ipcRenderer.removeListener('export:openDialog', listener)
}

contextBridge.exposeInMainWorld('timelog', api)
contextBridge.exposeInMainWorld('timelogEvents', { onOpenExportDialog })

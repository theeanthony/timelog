import { BrowserWindow, clipboard, dialog, ipcMain } from 'electron'
import { writeFileSync } from 'node:fs'
import { IPC, type ExportResult, type NewProject } from '../shared/ipc-contract'
import type { Db } from './db/database'
import { KEYS, setState } from './db/app-state'
import { addProject, listProjects } from './db/projects'
import { computeWeekTotals, weekTotalsToCsv } from './export/csv'
import type { Tracker } from './engine/tracker'
import type { Clock } from './platform/types'

export function registerIpc(db: Db, tracker: Tracker, clock: Clock): void {
  ipcMain.handle(IPC.getState, () => tracker.getTrackerState())

  ipcMain.handle(IPC.setManualOverride, (_e, code: string) => {
    tracker.setManualOverride(code)
  })

  ipcMain.handle(IPC.clearOverride, () => {
    tracker.clearOverride()
  })

  ipcMain.handle(IPC.setTrackingMode, (_e, mode: 'auto' | 'manual') => {
    tracker.setTrackingMode(mode)
  })

  ipcMain.handle(IPC.listProjects, () => listProjects(db))

  ipcMain.handle(IPC.addProject, (_e, p: NewProject) => {
    addProject(db, p, clock.now())
    tracker.reloadRules()
  })

  ipcMain.handle(IPC.completeSetup, (_e, trackingMode: 'auto' | 'manual') => {
    setState(db, KEYS.trackingMode, trackingMode === 'manual' ? 'manual' : 'auto')
    setState(db, KEYS.setupComplete, '1')
  })

  ipcMain.handle(IPC.getWeekTotals, (_e, weekStartIso: string) =>
    computeWeekTotals(db, weekStartIso)
  )

  ipcMain.handle(IPC.exportWeekCsv, async (e, weekStartIso: string): Promise<ExportResult> => {
    const totals = computeWeekTotals(db, weekStartIso)
    const win = BrowserWindow.fromWebContents(e.sender)
    const { canceled, filePath } = await dialog.showSaveDialog(win!, {
      defaultPath: `timelog-week-${weekStartIso}.csv`,
      filters: [{ name: 'CSV', extensions: ['csv'] }]
    })
    if (canceled || !filePath) return { canceled: true }
    writeFileSync(filePath, weekTotalsToCsv(totals), 'utf8')
    return { savedTo: filePath }
  })

  ipcMain.handle(IPC.copyWeekCsv, (_e, weekStartIso: string) => {
    clipboard.writeText(weekTotalsToCsv(computeWeekTotals(db, weekStartIso)))
  })
}

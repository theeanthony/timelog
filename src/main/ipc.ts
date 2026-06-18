import { app, BrowserWindow, clipboard, dialog, ipcMain } from 'electron'
import { writeFileSync } from 'node:fs'
import { IPC, type ExportResult, type NewProject } from '../shared/ipc-contract'
import type { PanelView, Prefs, RangeUnit, RuleField } from '../shared/types'
import type { Db } from './db/database'
import { setPanelView } from './window'
import { KEYS, setState } from './db/app-state'
import {
  addProject,
  addRule,
  addRuleForApp,
  addRuleForTitle,
  archiveProject,
  deleteProject,
  deleteRule,
  listProjects,
  listRules,
  renameProjectCode,
  reorderProjects,
  setPinned,
  updateProject,
  updateRule
} from './db/projects'
import { clearUnmatched, listUnmatched } from './db/unmatched'
import {
  deleteSession,
  insertClosedSession,
  reassignSession,
  sessionsOverlapping,
  splitSession
} from './db/sessions'
import { getIdleEvent, resolveIdleEvent } from './db/idle-events'
import { computeWeekTotals, weekTotalsToCsv } from './export/csv'
import { computeRangeBreakdown, computeWeekBreakdown } from './export/breakdown'
import { getPrefs, setPrefs } from './prefs'
import { checkForUpdates, installUpdate, setupUpdater } from './updater'
import { applyWindowPrefs, registerGlobalShortcut } from './runtime'
import type { Tracker } from './engine/tracker'
import type { Clock } from './platform/types'

const DAY_MS = 24 * 60 * 60 * 1000

export function registerIpc(db: Db, tracker: Tracker, clock: Clock, win: BrowserWindow): void {
  ipcMain.handle(IPC.getState, () => tracker.getTrackerState())

  ipcMain.handle(IPC.setManualOverride, (_e, code: string) => tracker.setManualOverride(code))
  ipcMain.handle(IPC.clearOverride, () => tracker.clearOverride())
  ipcMain.handle(IPC.setTrackingMode, (_e, mode: 'auto' | 'manual') =>
    tracker.setTrackingMode(mode)
  )

  ipcMain.handle(IPC.setPanelView, (_e, view: PanelView) => setPanelView(win, view))

  // ── projects ──────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.listProjects, (_e, includeArchived?: boolean) =>
    listProjects(db, { includeArchived })
  )

  ipcMain.handle(IPC.addProject, (_e, p: NewProject) => {
    addProject(db, p, clock.now())
    tracker.reloadRules()
  })

  ipcMain.handle(
    IPC.updateProject,
    (_e, code: string, patch: { label?: string; color?: string }) => {
      updateProject(db, code, patch)
      tracker.refresh()
    }
  )

  ipcMain.handle(IPC.renameProject, (_e, oldCode: string, newCode: string) => {
    try {
      renameProjectCode(db, oldCode, newCode.trim())
      tracker.reloadRules()
      tracker.refresh()
      return { ok: true } as const
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'rename failed' } as const
    }
  })

  ipcMain.handle(IPC.archiveProject, (_e, code: string, archived: boolean) => {
    archiveProject(db, code, archived)
    tracker.refresh()
  })

  ipcMain.handle(IPC.setProjectPinned, (_e, code: string, pinned: boolean) =>
    setPinned(db, code, pinned)
  )

  ipcMain.handle(IPC.reorderProjects, (_e, codes: string[]) => reorderProjects(db, codes))

  ipcMain.handle(IPC.deleteProject, (_e, code: string, reassignTo?: string) => {
    deleteProject(db, code, reassignTo)
    tracker.reloadRules()
    tracker.refresh()
  })

  // ── rules ─────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.listRules, (_e, projectCode?: string) => listRules(db, projectCode))

  ipcMain.handle(
    IPC.addRule,
    (_e, projectCode: string, pattern: string, priority?: number, field?: RuleField) => {
      const id = addRule(db, projectCode, pattern, priority, field)
      tracker.reloadRules()
      return id
    }
  )

  ipcMain.handle(IPC.addRuleForTitle, (_e, projectCode: string, title: string) => {
    const id = addRuleForTitle(db, projectCode, title)
    tracker.reloadRules()
    return id
  })

  ipcMain.handle(IPC.addRuleForApp, (_e, projectCode: string, appName: string) => {
    const id = addRuleForApp(db, projectCode, appName)
    tracker.reloadRules()
    return id
  })

  ipcMain.handle(
    IPC.updateRule,
    (
      _e,
      id: number,
      patch: { pattern?: string; priority?: number; enabled?: boolean; field?: RuleField }
    ) => {
      updateRule(db, id, patch)
      tracker.reloadRules()
    }
  )

  ipcMain.handle(IPC.deleteRule, (_e, id: number) => {
    deleteRule(db, id)
    tracker.reloadRules()
  })

  // ── unmatched windows (smart no-match review) ───────────────────────────────
  ipcMain.handle(IPC.listUnmatched, () => listUnmatched(db))

  ipcMain.handle(
    IPC.assignUnmatched,
    (_e, app: string, title: string, code: string, field: RuleField) => {
      if (field === 'app') addRuleForApp(db, code, app)
      else addRuleForTitle(db, code, title)
      clearUnmatched(db, app, title)
      tracker.reloadRules()
      tracker.refresh()
    }
  )

  // ── sessions (day timeline + manual entry) ─────────────────────────────────
  ipcMain.handle(IPC.listDaySessions, (_e, dayStartTs: number) =>
    sessionsOverlapping(db, dayStartTs, dayStartTs + DAY_MS)
  )

  ipcMain.handle(IPC.reassignSession, (_e, id: number, code: string) => {
    reassignSession(db, id, code)
    tracker.refresh()
  })

  ipcMain.handle(IPC.deleteSession, (_e, id: number) => {
    deleteSession(db, id)
    tracker.refresh()
  })

  ipcMain.handle(IPC.addManualSession, (_e, code: string, startTs: number, endTs: number) => {
    const id = insertClosedSession(db, code, startTs, endTs, 'manual', 'normal')
    tracker.refresh()
    return id
  })

  ipcMain.handle(IPC.splitSession, (_e, id: number, atTs: number) => {
    const newId = splitSession(db, id, atTs)
    tracker.refresh()
    return newId
  })

  // ── idle review ─────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.keepIdle, (_e, id: number) => {
    const ev = getIdleEvent(db, id)
    if (ev) insertClosedSession(db, ev.projectCode, ev.gapStartTs, ev.gapEndTs, 'manual', 'normal')
    resolveIdleEvent(db, id)
    tracker.refresh()
  })

  ipcMain.handle(IPC.discardIdle, (_e, id: number) => {
    resolveIdleEvent(db, id)
    tracker.refresh()
  })

  ipcMain.handle(IPC.reassignIdle, (_e, id: number, code: string) => {
    const ev = getIdleEvent(db, id)
    if (ev) insertClosedSession(db, code, ev.gapStartTs, ev.gapEndTs, 'manual', 'normal')
    resolveIdleEvent(db, id)
    tracker.refresh()
  })

  // ── preferences + app info ─────────────────────────────────────────────────
  ipcMain.handle(IPC.getPrefs, () => getPrefs(db))

  ipcMain.handle(IPC.setPrefs, (_e, patch: Partial<Prefs>) => {
    const prefs = setPrefs(db, patch)
    applyWindowPrefs(win, prefs)
    if ('globalShortcut' in patch) registerGlobalShortcut(win, prefs.globalShortcut)
    tracker.refresh()
    return prefs
  })

  ipcMain.handle(IPC.getAppInfo, () => ({ version: app.getVersion(), platform: process.platform }))

  // ── updates (manual check) ─────────────────────────────────────────────────
  setupUpdater(win)
  ipcMain.handle(IPC.checkForUpdates, () => checkForUpdates())
  ipcMain.handle(IPC.installUpdate, () => installUpdate())

  ipcMain.handle(IPC.completeSetup, (_e, trackingMode: 'auto' | 'manual') => {
    setState(db, KEYS.trackingMode, trackingMode === 'manual' ? 'manual' : 'auto')
    setState(db, KEYS.setupComplete, '1')
  })

  // ── export ──────────────────────────────────────────────────────────────────
  ipcMain.handle(IPC.getWeekTotals, (_e, weekStartIso: string) =>
    computeWeekTotals(db, weekStartIso)
  )

  ipcMain.handle(IPC.getWeekBreakdown, (_e, weekStartIso: string) =>
    computeWeekBreakdown(db, weekStartIso)
  )

  ipcMain.handle(IPC.getRangeBreakdown, (_e, unit: RangeUnit, startIso: string, numDays: number) =>
    computeRangeBreakdown(db, unit, startIso, numDays)
  )

  ipcMain.handle(IPC.exportWeekCsv, async (e, weekStartIso: string): Promise<ExportResult> => {
    const totals = computeWeekTotals(db, weekStartIso)
    return saveCsv(e, `timelog-week-${weekStartIso}.csv`, weekTotalsToCsv(totals))
  })

  ipcMain.handle(IPC.copyWeekCsv, (_e, weekStartIso: string) => {
    clipboard.writeText(weekTotalsToCsv(computeWeekTotals(db, weekStartIso)))
  })

  ipcMain.handle(
    IPC.exportRangeCsv,
    async (e, unit: RangeUnit, startIso: string, numDays: number): Promise<ExportResult> => {
      const range = computeRangeBreakdown(db, unit, startIso, numDays)
      const csv = weekTotalsToCsv({ weekStartIso: startIso, rows: range.totals })
      return saveCsv(e, `timelog-${unit}-${startIso}.csv`, csv)
    }
  )

  ipcMain.handle(IPC.copyRangeCsv, (_e, unit: RangeUnit, startIso: string, numDays: number) => {
    const range = computeRangeBreakdown(db, unit, startIso, numDays)
    clipboard.writeText(weekTotalsToCsv({ weekStartIso: startIso, rows: range.totals }))
  })
}

async function saveCsv(
  e: Electron.IpcMainInvokeEvent,
  defaultName: string,
  contents: string
): Promise<ExportResult> {
  const win = BrowserWindow.fromWebContents(e.sender)
  const { canceled, filePath } = await dialog.showSaveDialog(win!, {
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (canceled || !filePath) return { canceled: true }
  writeFileSync(filePath, contents, 'utf8')
  return { savedTo: filePath }
}

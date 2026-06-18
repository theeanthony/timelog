import { app, type BrowserWindow } from 'electron'
import electronUpdater from 'electron-updater'
import { IPC } from '../shared/ipc-contract'
import type { UpdateStatus } from '../shared/types'

// electron-updater is CommonJS; destructure from the default import so it works
// under the ESM main bundle.
const { autoUpdater } = electronUpdater

let mainWin: BrowserWindow | null = null

function push(status: UpdateStatus): void {
  if (mainWin && !mainWin.isDestroyed()) mainWin.webContents.send(IPC.updateStatus, status)
}

function message(err: unknown): string {
  if (err instanceof Error) return err.message
  return err == null ? 'unknown error' : String(err)
}

/**
 * Wire up electron-updater for a manual ("Check for updates") flow: we never
 * check on startup, but once the user triggers a check we auto-download any
 * newer GitHub release (delta download via the NSIS blockmap) and let them
 * restart to apply it. All progress is pushed to the renderer as UpdateStatus.
 */
export function setupUpdater(win: BrowserWindow): void {
  mainWin = win
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => push({ state: 'checking' }))
  autoUpdater.on('update-available', (info) => push({ state: 'available', version: info.version }))
  autoUpdater.on('update-not-available', () =>
    push({ state: 'up-to-date', version: app.getVersion() })
  )
  autoUpdater.on('download-progress', (p) =>
    push({ state: 'downloading', percent: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    push({ state: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (err) => push({ state: 'error', message: message(err) }))
}

/** Trigger a manual update check. Detailed progress arrives via UpdateStatus pushes. */
export async function checkForUpdates(): Promise<UpdateStatus> {
  // The updater only works in a packaged build (it reads app-update.yml).
  if (!app.isPackaged) {
    const s: UpdateStatus = { state: 'dev' }
    push(s)
    return s
  }
  try {
    push({ state: 'checking' })
    await autoUpdater.checkForUpdates()
    return { state: 'checking' }
  } catch (err) {
    const s: UpdateStatus = { state: 'error', message: message(err) }
    push(s)
    return s
  }
}

/** Quit and install a downloaded update. */
export function installUpdate(): void {
  try {
    autoUpdater.quitAndInstall()
  } catch {
    /* ignore — nothing downloaded yet */
  }
}

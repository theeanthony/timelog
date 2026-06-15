import { app, BrowserWindow, globalShortcut } from 'electron'
import { join } from 'node:path'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { IPC } from '../shared/ipc-contract'
import { openDatabase } from './db/database'
import { recoverOrphanedSession } from './db/sessions'
import { Tracker, TICK_MS } from './engine/tracker'
import { GetWindowsSource } from './platform/get-windows-source'
import { PowerIdleSource } from './platform/power-idle-source'
import { systemClock } from './platform/types'
import { registerIpc } from './ipc'
import { createPanelWindow } from './window'
import { createTray } from './tray'
import { Notifier } from './notifier'
import { getPrefs } from './prefs'
import { applyWindowPrefs, registerGlobalShortcut } from './runtime'

let isQuitting = false

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.whenReady().then(() => {
    electronApp.setAppUserModelId('dev.timelog.app')
    app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))

    // Keep dev dogfood data separate from packaged-app data.
    const dbName = is.dev ? 'timelog-dev.db' : 'timelog.db'
    const db = openDatabase(join(app.getPath('userData'), dbName))

    const recovered = recoverOrphanedSession(db)
    if (recovered !== null) {
      console.log(`[timelog] recovered orphaned session #${recovered} (crash_recovery)`)
    }

    const win = createPanelWindow(db)
    const notifier = new Notifier(db, systemClock)

    const tracker = new Tracker({
      db,
      windowSource: new GetWindowsSource(),
      idleSource: new PowerIdleSource(),
      clock: systemClock,
      onState: (state) => {
        if (!win.isDestroyed()) win.webContents.send(IPC.stateUpdate, state)
        notifier.onState(state)
      }
    })

    registerIpc(db, tracker, systemClock, win)

    // Apply persisted prefs to the window/OS and bind the global hotkey.
    const prefs = getPrefs(db)
    applyWindowPrefs(win, prefs)
    registerGlobalShortcut(win, prefs.globalShortcut)

    const interval = setInterval(() => {
      tracker.tick().catch((err) => console.error('[timelog] tick failed:', err))
    }, TICK_MS)

    // Coarse 60s cadence for the optional end-of-day summary.
    const dailyInterval = setInterval(() => notifier.checkDaily(), 60_000)

    createTray(
      win,
      () => {
        win.show()
        win.webContents.send('export:openDialog')
      },
      () => {
        win.show()
        win.webContents.send('settings:open')
      }
    )

    // Closing the panel hides it to the tray; the tracker keeps running.
    win.on('close', (e) => {
      if (!isQuitting) {
        e.preventDefault()
        win.hide()
      }
    })

    app.on('before-quit', () => {
      isQuitting = true
      clearInterval(interval)
      clearInterval(dailyInterval)
      globalShortcut.unregisterAll()
      tracker.shutdown()
      db.close()
    })

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createPanelWindow(db)
      else win.show()
    })
  })

  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.show()
      win.focus()
    }
  })

  // Tray app: do not quit when the window is hidden/closed.
  app.on('window-all-closed', () => {
    // Intentionally empty — quitting happens via the tray menu.
  })
}

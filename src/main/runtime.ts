import { app, BrowserWindow, globalShortcut } from 'electron'
import type { Prefs } from '../shared/types'

/** Apply preferences that affect the OS / window, not the database. */
export function applyWindowPrefs(win: BrowserWindow, prefs: Prefs): void {
  if (!win.isDestroyed()) win.setAlwaysOnTop(prefs.alwaysOnTop, 'floating')
  // Only touch the login item when it actually needs to change — calling it
  // redundantly (e.g. false→false on every launch) errors on unsigned dev
  // builds. Unpackaged apps can't register a login item at all, so skip them.
  try {
    if (!app.isPackaged) return
    if (app.getLoginItemSettings().openAtLogin !== prefs.launchAtLogin) {
      app.setLoginItemSettings({ openAtLogin: prefs.launchAtLogin })
    }
  } catch {
    // Ignore on platforms that don't support it.
  }
}

/**
 * Register the global show/hide accelerator, replacing any prior one. Returns
 * true if it bound successfully (a bad/empty accelerator just no-ops).
 */
export function registerGlobalShortcut(win: BrowserWindow, accelerator: string): boolean {
  globalShortcut.unregisterAll()
  if (!accelerator) return false
  try {
    return globalShortcut.register(accelerator, () => {
      if (win.isDestroyed()) return
      if (win.isVisible() && win.isFocused()) win.hide()
      else {
        win.show()
        win.focus()
      }
    })
  } catch {
    return false
  }
}

import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import type { Db } from './db/database'
import type { PanelView } from '../shared/types'
import { KEYS, getState, setState } from './db/app-state'

/** Default full-panel size (the user can resize from here; persisted). */
export const PANEL_WIDTH = 360
export const PANEL_HEIGHT = 560
/** Smallest the full panel may be dragged to. */
export const MIN_PANEL_WIDTH = 300
export const MIN_PANEL_HEIGHT = 380
/** Minimized "small rectangle" — just the project dot + timer. */
export const COMPACT_SIZE = { width: 208, height: 40 }
/** Hover-peek — adds the project label + today's total + restore button. */
export const PEEK_SIZE = { width: 248, height: 150 }

/** Current view per window, so resize/move persistence only fires in full view. */
const viewOf = new WeakMap<BrowserWindow, PanelView>()
/** Last full-view size per window, restored when returning from compact/peek. */
const lastFull = new WeakMap<BrowserWindow, { width: number; height: number }>()

const clamp = (v: number, lo: number): number => (v < lo ? lo : v)

function fullSize(win: BrowserWindow): { width: number; height: number } {
  return lastFull.get(win) ?? { width: PANEL_WIDTH, height: PANEL_HEIGHT }
}

/**
 * Resize the floating panel between the full view, the minimized bar, and the
 * hover-peek. Anchored to the panel's top-right corner (it docks bottom-right)
 * so it grows/shrinks in place. Only the full view is user-resizable; the
 * minimum size is set *before* the bounds so shrinking to the bar isn't blocked.
 */
export function setPanelView(win: BrowserWindow, view: PanelView): void {
  viewOf.set(win, view)
  const size = view === 'full' ? fullSize(win) : view === 'peek' ? PEEK_SIZE : COMPACT_SIZE
  const b = win.getBounds()
  win.setResizable(true)
  win.setMinimumSize(
    view === 'full' ? MIN_PANEL_WIDTH : size.width,
    view === 'full' ? MIN_PANEL_HEIGHT : size.height
  )
  win.setBounds({ x: b.x + b.width - size.width, y: b.y, width: size.width, height: size.height })
  win.setResizable(view === 'full')
  win.setMaximizable(view === 'full')
}

export function createPanelWindow(db: Db): BrowserWindow {
  const saved = readSize(db)
  const win = new BrowserWindow({
    width: saved.width,
    height: saved.height,
    minWidth: MIN_PANEL_WIDTH,
    minHeight: MIN_PANEL_HEIGHT,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    fullscreenable: false,
    maximizable: false,
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.mjs'),
      // ESM preload scripts require sandbox: false (sandboxed preloads are
      // CJS-only). Context isolation stays on and no remote content loads.
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  viewOf.set(win, 'full')
  lastFull.set(win, saved)
  win.setAlwaysOnTop(true, 'floating')
  restorePosition(db, win, saved)

  win.on('moved', () => {
    if (viewOf.get(win) !== 'full') return
    const b = win.getBounds()
    setState(db, KEYS.windowPosition, JSON.stringify({ x: b.x, y: b.y }))
  })

  // Remember the full panel's size after a user drag (fires once at drag end).
  win.on('resized', () => {
    if (viewOf.get(win) !== 'full') return
    const b = win.getBounds()
    lastFull.set(win, { width: b.width, height: b.height })
    setState(db, KEYS.windowSize, JSON.stringify({ width: b.width, height: b.height }))
    setState(db, KEYS.windowPosition, JSON.stringify({ x: b.x, y: b.y }))
  })

  win.on('ready-to-show', () => win.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }
  return win
}

/** Saved full-panel size, clamped to the minimum (defaults to PANEL_*). */
function readSize(db: Db): { width: number; height: number } {
  const saved = getState(db, KEYS.windowSize)
  if (saved) {
    try {
      const { width, height } = JSON.parse(saved) as { width: number; height: number }
      return { width: clamp(width, MIN_PANEL_WIDTH), height: clamp(height, MIN_PANEL_HEIGHT) }
    } catch {
      // Ignore corrupt saved size.
    }
  }
  return { width: PANEL_WIDTH, height: PANEL_HEIGHT }
}

function restorePosition(
  db: Db,
  win: BrowserWindow,
  size: { width: number; height: number }
): void {
  const saved = getState(db, KEYS.windowPosition)
  if (!saved) {
    // Default: bottom-right corner of the primary display.
    const { workArea } = screen.getPrimaryDisplay()
    win.setPosition(
      workArea.x + workArea.width - size.width - 24,
      workArea.y + workArea.height - size.height - 24
    )
    return
  }
  try {
    const { x, y } = JSON.parse(saved) as { x: number; y: number }
    // Only restore if still on a visible display.
    const visible = screen.getAllDisplays().some((d) => {
      const a = d.workArea
      return x >= a.x - size.width && x < a.x + a.width && y >= a.y - 40 && y < a.y + a.height
    })
    if (visible) win.setPosition(x, y)
  } catch {
    // Ignore corrupt saved position.
  }
}

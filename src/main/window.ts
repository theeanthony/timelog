import { BrowserWindow, screen } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import type { Db } from './db/database'
import { KEYS, getState, setState } from './db/app-state'

export const PANEL_WIDTH = 320
export const PANEL_HEIGHT = 480

export function createPanelWindow(db: Db): BrowserWindow {
  const win = new BrowserWindow({
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    frame: false,
    resizable: false,
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

  win.setAlwaysOnTop(true, 'floating')
  restorePosition(db, win)
  win.on('moved', () => {
    const [x, y] = win.getPosition()
    setState(db, KEYS.windowPosition, JSON.stringify({ x, y }))
  })

  win.on('ready-to-show', () => win.show())

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(import.meta.dirname, '../renderer/index.html'))
  }
  return win
}

function restorePosition(db: Db, win: BrowserWindow): void {
  const saved = getState(db, KEYS.windowPosition)
  if (!saved) {
    // Default: bottom-right corner of the primary display.
    const { workArea } = screen.getPrimaryDisplay()
    win.setPosition(workArea.x + workArea.width - PANEL_WIDTH - 24, workArea.y + workArea.height - PANEL_HEIGHT - 24)
    return
  }
  try {
    const { x, y } = JSON.parse(saved) as { x: number; y: number }
    // Only restore if still on a visible display.
    const visible = screen.getAllDisplays().some((d) => {
      const a = d.workArea
      return x >= a.x - PANEL_WIDTH && x < a.x + a.width && y >= a.y - 40 && y < a.y + a.height
    })
    if (visible) win.setPosition(x, y)
  } catch {
    // Ignore corrupt saved position.
  }
}

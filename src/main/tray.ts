import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { join } from 'node:path'

export function createTray(win: BrowserWindow, onExportWeek: () => void): Tray {
  const iconPath = join(import.meta.dirname, '../../resources/icon.png')
  let image = nativeImage.createFromPath(iconPath)
  if (!image.isEmpty()) image = image.resize({ width: 16, height: 16 })
  const tray = new Tray(image)
  tray.setToolTip('timelog')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Show / hide panel',
      click: () => (win.isVisible() ? win.hide() : win.show())
    },
    { label: 'Export week…', click: onExportWeek },
    { type: 'separator' },
    {
      label: 'Quit timelog',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => (win.isVisible() ? win.hide() : win.show()))
  return tray
}

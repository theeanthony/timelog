import { activeWindow } from 'get-windows'
import { systemPreferences } from 'electron'
import type { ActiveWindowInfo, WindowSource } from './types'

/**
 * Active-window reader for macOS and Windows via get-windows.
 * Uses only UI-layer APIs (GetForegroundWindow/GetWindowText on Windows);
 * never any process-memory inspection.
 */
export class GetWindowsSource implements WindowSource {
  async getActiveWindow(): Promise<ActiveWindowInfo | null> {
    try {
      const win = await activeWindow({
        accessibilityPermission: false,
        screenRecordingPermission: false
      })
      if (!win) return null
      return { title: win.title, appName: win.owner.name }
    } catch {
      return null
    }
  }

  async checkPermission(): Promise<'granted' | 'denied' | 'unknown'> {
    if (process.platform === 'darwin') {
      // Window titles need Screen Recording on macOS 10.15+.
      return systemPreferences.getMediaAccessStatus('screen') === 'granted' ? 'granted' : 'denied'
    }
    return 'granted'
  }
}

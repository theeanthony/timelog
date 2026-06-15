import { useState } from 'react'
import type { TrackerMode, TrackingMode } from '../../../shared/types'

interface Props {
  mode: TrackerMode
  trackingMode: TrackingMode
  onOpenSettings: () => void
}

const COACH_KEY = 'timelog.coach.mode'

export function Titlebar({ mode, trackingMode, onOpenSettings }: Props): React.JSX.Element {
  const [showCoach, setShowCoach] = useState(() => {
    try {
      return localStorage.getItem(COACH_KEY) !== '1'
    } catch {
      return false
    }
  })

  const dismissCoach = (): void => {
    setShowCoach(false)
    try {
      localStorage.setItem(COACH_KEY, '1')
    } catch {
      // Ignore storage failures; the coach mark just reappears next launch.
    }
  }

  const toggle = (): void => {
    dismissCoach()
    void window.timelog.setTrackingMode(trackingMode === 'manual' ? 'auto' : 'manual')
  }

  return (
    <header className="titlebar">
      <span className="titlebar-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="titlebar-name">timelog</span>
      <button
        type="button"
        className="titlebar-gear"
        aria-label="settings"
        title="Settings (⌘,)"
        onClick={onOpenSettings}
      >
        ⚙
      </button>
      <button
        type="button"
        className={`mode-badge mode-badge--${mode} mode-badge--button`}
        onClick={toggle}
        title={
          trackingMode === 'manual'
            ? 'Manual check-in: window titles are never read. Click to switch to automatic tracking.'
            : 'Automatic: tracks by active window title. Click to switch to manual check-in (no window reading).'
        }
      >
        {mode === 'manual' ? 'MANUAL' : 'AUTO'}
      </button>
      {showCoach && (
        <div className="coach" role="note">
          <span>
            This badge toggles <b>automatic</b> ↔ <b>manual</b> tracking anytime.
          </span>
          <button type="button" className="coach-dismiss" onClick={dismissCoach}>
            got it
          </button>
        </div>
      )}
    </header>
  )
}

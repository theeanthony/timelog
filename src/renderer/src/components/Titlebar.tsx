import type { TrackerMode, TrackingMode } from '../../../shared/types'

interface Props {
  mode: TrackerMode
  trackingMode: TrackingMode
}

export function Titlebar({ mode, trackingMode }: Props): React.JSX.Element {
  const toggle = (): void => {
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
    </header>
  )
}

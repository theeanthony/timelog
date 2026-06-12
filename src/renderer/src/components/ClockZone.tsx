import type { TrackerState } from '../../../shared/types'
import { formatClock, todayTotalMs } from '../hooks/useTrackerState'

interface Props {
  state: TrackerState
  nowMs: number
}

const STATUS_NOTES: Record<string, string> = {
  idle: 'idle — timer paused',
  locked: 'screen locked',
  no_match: 'no project matched',
  permission_needed: 'screen recording permission needed'
}

export function ClockZone({ state, nowMs }: Props): React.JSX.Element {
  const active = state.activeProject
  const elapsed = active ? todayTotalMs(state, active.code, nowMs) : 0
  const note = STATUS_NOTES[state.status]

  return (
    <section className="clock-zone">
      {active ? (
        <>
          <div className="clock-project">
            <span className="clock-dot" style={{ background: active.color }} />
            {active.label}
          </div>
          <div className="clock-timer">{formatClock(elapsed)}</div>
          <div className="clock-meta">
            <span className="code-badge">{active.code}</span>
            {state.mode === 'manual' && (
              <span className="manual-indicator">
                <i className="pulse-dot" />
                manual override
              </span>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="clock-project clock-project--empty">—</div>
          <div className="clock-timer clock-timer--stopped">00:00:00</div>
        </>
      )}
      {note && (
        <div className={`status-note status-note--${state.status}`}>
          {note}
          {state.status === 'no_match' && state.lastWindowTitle && (
            <span className="status-title" title={state.lastWindowTitle}>
              {state.lastWindowTitle}
            </span>
          )}
        </div>
      )}
    </section>
  )
}

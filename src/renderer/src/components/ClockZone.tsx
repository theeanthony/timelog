import { useState } from 'react'
import type { Project, TrackerState } from '../../../shared/types'
import { formatClock, todayTotalMs } from '../hooks/useTrackerState'

interface Props {
  state: TrackerState
  nowMs: number
  projects: Project[]
  onChanged: () => void
}

const STATUS_NOTES: Record<string, string> = {
  idle: 'idle — timer paused',
  locked: 'screen locked',
  no_match: 'no project matched',
  permission_needed: 'screen recording permission needed — or switch to manual',
  checked_out: 'checked out — tap a project to check in'
}

export function ClockZone({ state, nowMs, projects, onChanged }: Props): React.JSX.Element {
  const [picking, setPicking] = useState(false)
  const active = state.activeProject
  const elapsed = active ? todayTotalMs(state, active.code, nowMs) : 0
  const note = STATUS_NOTES[state.status]
  const canTeach = state.status === 'no_match' && !!state.lastWindowTitle

  const teach = async (code: string): Promise<void> => {
    // Map this window's title to the chosen project and start tracking it now.
    await window.timelog.addRuleForTitle(code, state.lastWindowTitle)
    await window.timelog.setManualOverride(code)
    setPicking(false)
    onChanged()
  }

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
                {state.trackingMode === 'manual' ? 'checked in' : 'manual override'}
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

      {canTeach &&
        (picking ? (
          <div className="teach-picker">
            {projects
              .filter((p) => !p.archived)
              .map((p) => (
                <button
                  key={p.code}
                  type="button"
                  className="idle-pick"
                  onClick={() => teach(p.code)}
                >
                  <span className="project-dot" style={{ background: p.color }} />
                  {p.code}
                </button>
              ))}
            <button type="button" className="btn btn--ghost" onClick={() => setPicking(false)}>
              cancel
            </button>
          </div>
        ) : (
          <button type="button" className="teach-cta" onClick={() => setPicking(true)}>
            track this window as →
          </button>
        ))}
    </section>
  )
}

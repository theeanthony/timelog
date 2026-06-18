import { useState } from 'react'
import type { Project, TrackerState } from '../../../shared/types'
import { formatClock, todayTotalMs } from '../hooks/useTrackerState'

interface Props {
  state: TrackerState
  nowMs: number
  projects: Project[]
  onChanged: () => void
  /** Open the rules editor (from the "what matched" caption's fix link). */
  onOpenRules: () => void
}

const STATUS_NOTES: Record<string, string> = {
  idle: 'idle — timer paused',
  locked: 'screen locked',
  no_match: 'no project matched',
  permission_needed: 'screen recording permission needed — or switch to manual',
  checked_out: 'checked out — tap a project to check in'
}

export function ClockZone({
  state,
  nowMs,
  projects,
  onChanged,
  onOpenRules
}: Props): React.JSX.Element {
  const [picking, setPicking] = useState(false)
  const active = state.activeProject
  const elapsed = active ? todayTotalMs(state, active.code, nowMs) : 0
  const note = STATUS_NOTES[state.status]
  const canTeach = state.status === 'no_match' && !!state.lastWindowTitle
  const suggested =
    state.status === 'no_match' && state.suggestedProjectCode
      ? (projects.find((p) => p.code === state.suggestedProjectCode && !p.archived) ?? null)
      : null

  const teach = async (code: string): Promise<void> => {
    // Map this window's title to the chosen project and start tracking it now.
    await window.timelog.addRuleForTitle(code, state.lastWindowTitle)
    await window.timelog.setManualOverride(code)
    setPicking(false)
    onChanged()
  }

  const acceptSuggestion = async (): Promise<void> => {
    if (!suggested) return
    // Teach the whole app (not just this title) so it sticks, then track it now.
    if (state.lastAppName) await window.timelog.addRuleForApp(suggested.code, state.lastAppName)
    else await window.timelog.addRuleForTitle(suggested.code, state.lastWindowTitle)
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
          {state.mode === 'auto' && state.matchInfo && (
            <button
              type="button"
              className="match-note"
              onClick={onOpenRules}
              title="edit match rules"
            >
              {state.matchInfo.by === 'app'
                ? `matched ${state.matchInfo.value} · app`
                : `matched “${state.matchInfo.value}” · title`}
              <span className="match-fix"> · fix</span>
            </button>
          )}
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

      {suggested && !picking && (
        <button type="button" className="suggest-cta" onClick={() => void acceptSuggestion()}>
          track <b>{state.lastAppName || 'this window'}</b> as
          <span className="project-dot" style={{ background: suggested.color }} />
          {suggested.code} →
        </button>
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

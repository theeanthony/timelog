import { useRef } from 'react'
import type { TrackerState } from '../../../shared/types'
import { formatClock, formatShort, todayTotalMs } from '../hooks/useTrackerState'

interface Props {
  state: TrackerState
  nowMs: number
  /** 'compact' = the bar; 'peek' = the hover-expanded bar. */
  view: 'compact' | 'peek'
  onPeek: () => void
  onCollapse: () => void
  onRestore: () => void
}

/**
 * The minimized floating bar: active project dot + running timer. Click anywhere
 * on the bar to restore the full panel; hovering peeks (project label + today's
 * total). Only the dot is a window-drag handle — making the whole bar a drag
 * region would swallow the hover/click and trap you in minimized mode.
 */
export function CompactBar({
  state,
  nowMs,
  view,
  onPeek,
  onCollapse,
  onRestore
}: Props): React.JSX.Element {
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const active = state.activeProject
  const elapsed = active ? todayTotalMs(state, active.code, nowMs) : 0
  const totalToday =
    Object.values(state.todayMsByProject).reduce((a, b) => a + b, 0) +
    (active && state.openSessionStartTs !== null
      ? Math.max(0, nowMs - state.openSessionStartTs)
      : 0)

  const enter = (): void => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
    onPeek()
  }
  const leave = (): void => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(onCollapse, 250)
  }

  return (
    <div
      className={`compact-bar${view === 'peek' ? ' compact-bar--peek' : ''}`}
      data-status={state.status}
      role="button"
      tabIndex={0}
      aria-label="restore panel"
      title="Click to restore"
      onMouseEnter={enter}
      onMouseLeave={leave}
      onClick={onRestore}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onRestore()
        }
      }}
    >
      <div className="compact-row">
        <span
          className="compact-dot"
          title="drag to move"
          style={{ background: active?.color ?? 'var(--text-dim)' }}
        />
        <span className={`compact-timer${active ? '' : ' compact-timer--stopped'}`}>
          {active ? formatClock(elapsed) : '00:00:00'}
        </span>
        {view === 'peek' && (
          <span className="compact-restore" aria-hidden>
            ⤢
          </span>
        )}
      </div>
      {view === 'peek' && (
        <div className="compact-detail">
          <span className="compact-label">{active ? active.label : '— no project'}</span>
          <span className="compact-today">today {formatShort(totalToday)}</span>
        </div>
      )}
    </div>
  )
}

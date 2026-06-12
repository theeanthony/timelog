import type { Project, TrackerState } from '../../../shared/types'
import { formatShort, todayTotalMs } from '../hooks/useTrackerState'

interface Props {
  projects: Project[]
  state: TrackerState
  nowMs: number
}

export function ProjectList({ projects, state, nowMs }: Props): React.JSX.Element {
  const activeCode = state.activeProject?.code ?? null

  const onTap = (code: string): void => {
    if (state.mode === 'manual' && activeCode === code) {
      // Tapping the active manual project releases the override.
      void window.timelog.clearOverride()
    } else {
      void window.timelog.setManualOverride(code)
    }
  }

  return (
    <ul className="project-list">
      {projects.map((p) => {
        const isActive = p.code === activeCode
        return (
          <li key={p.code}>
            <button
              type="button"
              className={`project-row${isActive ? ' project-row--active' : ''}`}
              onClick={() => onTap(p.code)}
              title={
                isActive && state.mode === 'manual'
                  ? 'Tap to release manual override'
                  : `Track ${p.code} manually`
              }
            >
              <span className="project-dot" style={{ background: p.color }} />
              <span className="project-code">{p.code}</span>
              <span className="project-label">{p.label}</span>
              <span className="project-total">{formatShort(todayTotalMs(state, p.code, nowMs))}</span>
            </button>
          </li>
        )
      })}
      {projects.length === 0 && <li className="project-list-empty">no projects yet</li>}
    </ul>
  )
}

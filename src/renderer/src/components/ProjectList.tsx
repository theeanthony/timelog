import { useMemo, useState } from 'react'
import type { Project, TrackerState } from '../../../shared/types'
import { formatShort, todayTotalMs } from '../hooks/useTrackerState'

interface Props {
  projects: Project[]
  state: TrackerState
  nowMs: number
  onEditProject: (p: Project) => void
  onAddProject: () => void
  onChanged: () => void
}

const SEARCH_THRESHOLD = 8

export function ProjectList({
  projects,
  state,
  nowMs,
  onEditProject,
  onAddProject,
  onChanged
}: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [dragCode, setDragCode] = useState<string | null>(null)

  const activeCode = state.activeProject?.code ?? null
  const hasArchived = projects.some((p) => p.archived)

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return projects.filter((p) => {
      if (!showArchived && p.archived) return false
      if (!q) return true
      return p.code.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)
    })
  }, [projects, query, showArchived])

  // Reordering is only coherent in the default, unfiltered view.
  const canReorder = !query.trim() && !showArchived

  const onTap = (code: string): void => {
    if (state.mode === 'manual' && activeCode === code) void window.timelog.clearOverride()
    else void window.timelog.setManualOverride(code)
  }

  const togglePin = async (p: Project): Promise<void> => {
    await window.timelog.setProjectPinned(p.code, !p.pinned)
    onChanged()
  }

  const onDrop = async (targetCode: string): Promise<void> => {
    if (!dragCode || dragCode === targetCode) return
    const codes = visible.map((p) => p.code)
    const from = codes.indexOf(dragCode)
    const to = codes.indexOf(targetCode)
    if (from < 0 || to < 0) return
    codes.splice(to, 0, codes.splice(from, 1)[0])
    setDragCode(null)
    await window.timelog.reorderProjects(codes)
    onChanged()
  }

  if (projects.length === 0) {
    return (
      <div className="project-list project-list--empty">
        <p className="empty-title">no charge codes yet</p>
        <button type="button" className="btn" onClick={onAddProject}>
          + add your first charge code
        </button>
      </div>
    )
  }

  return (
    <div className="project-list-wrap">
      {projects.filter((p) => !p.archived).length > SEARCH_THRESHOLD && (
        <input
          className="input project-search"
          placeholder="search projects…"
          value={query}
          spellCheck={false}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="search projects"
        />
      )}
      <ul className="project-list">
        {visible.map((p) => {
          const isActive = p.code === activeCode
          return (
            <li
              key={p.code}
              className={`project-li${dragCode === p.code ? ' project-li--dragging' : ''}`}
              draggable={canReorder}
              onDragStart={() => canReorder && setDragCode(p.code)}
              onDragOver={(e) => canReorder && e.preventDefault()}
              onDrop={() => void onDrop(p.code)}
            >
              <button
                type="button"
                className={`project-row${isActive ? ' project-row--active' : ''}${p.archived ? ' project-row--archived' : ''}`}
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
                <span className="project-total">
                  {formatShort(todayTotalMs(state, p.code, nowMs))}
                </span>
              </button>
              <div className="project-actions">
                <button
                  type="button"
                  className={`row-icon${p.pinned ? ' row-icon--on' : ''}`}
                  title={p.pinned ? 'Unpin' : 'Pin to top'}
                  aria-label={p.pinned ? 'unpin project' : 'pin project'}
                  onClick={() => void togglePin(p)}
                >
                  {p.pinned ? '★' : '☆'}
                </button>
                <button
                  type="button"
                  className="row-icon"
                  title="Edit"
                  aria-label="edit project"
                  onClick={() => onEditProject(p)}
                >
                  ✎
                </button>
              </div>
            </li>
          )
        })}
        {visible.length === 0 && <li className="project-list-empty">no match</li>}
      </ul>
      {hasArchived && (
        <button
          type="button"
          className="archived-toggle"
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? 'hide archived' : 'show archived'}
        </button>
      )}
    </div>
  )
}

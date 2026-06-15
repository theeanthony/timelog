import { useMemo, useState } from 'react'
import type { Project, TrackerState } from '../../../shared/types'

interface Props {
  projects: Project[]
  state: TrackerState
  onClose: () => void
}

/** Cmd/Ctrl+K palette: type to filter, ↑/↓ to move, Enter to switch. */
export function QuickSwitch({ projects, state, onClose }: Props): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const active = projects.filter((p) => !p.archived)
    if (!q) return active
    return active.filter(
      (p) => p.code.toLowerCase().includes(q) || p.label.toLowerCase().includes(q)
    )
  }, [projects, query])

  const choose = (p: Project | undefined): void => {
    if (!p) return
    void window.timelog.setManualOverride(p.code)
    onClose()
  }

  const checkOut = (): void => {
    void window.timelog.clearOverride()
    onClose()
  }

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, matches.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(matches[index])
    }
  }

  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-label="quick switch"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          className="palette-input"
          placeholder="switch project…"
          value={query}
          autoFocus
          spellCheck={false}
          onChange={(e) => {
            setQuery(e.target.value)
            setIndex(0)
          }}
          onKeyDown={onKeyDown}
        />
        <ul className="palette-list">
          {matches.map((p, i) => (
            <li key={p.code}>
              <button
                type="button"
                className={`palette-row${i === index ? ' palette-row--active' : ''}`}
                onMouseEnter={() => setIndex(i)}
                onClick={() => choose(p)}
              >
                <span className="project-dot" style={{ background: p.color }} />
                <span className="project-code">{p.code}</span>
                <span className="project-label">{p.label}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 && <li className="palette-empty">no match</li>}
        </ul>
        {state.openSessionStartTs !== null && (
          <button type="button" className="palette-checkout" onClick={checkOut}>
            check out (stop the clock)
          </button>
        )}
      </div>
    </div>
  )
}

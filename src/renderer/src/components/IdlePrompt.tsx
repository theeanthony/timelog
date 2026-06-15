import { useState } from 'react'
import type { IdleEvent, Project } from '../../../shared/types'
import { formatShort, formatTimeOfDay } from '../hooks/useTrackerState'

interface Props {
  event: IdleEvent
  projects: Project[]
  onResolved: () => void
}

/**
 * Inline review for a just-ended idle gap. The time was excluded by default;
 * the user can keep it on the same project, move it elsewhere, or confirm the
 * discard. One card shows at a time (the oldest pending event).
 */
export function IdlePrompt({ event, projects, onResolved }: Props): React.JSX.Element {
  const [reassigning, setReassigning] = useState(false)
  const gapMs = event.gapEndTs - event.gapStartTs
  const project = projects.find((p) => p.code === event.projectCode)

  const keep = async (): Promise<void> => {
    await window.timelog.keepIdle(event.id)
    onResolved()
  }
  const discard = async (): Promise<void> => {
    await window.timelog.discardIdle(event.id)
    onResolved()
  }
  const reassign = async (code: string): Promise<void> => {
    await window.timelog.reassignIdle(event.id, code)
    onResolved()
  }

  return (
    <div className="idle-prompt" role="alertdialog" aria-label="idle time review">
      <div className="idle-prompt-head">
        <span className="idle-prompt-title">idle {formatShort(gapMs)}</span>
        <span className="idle-prompt-sub">
          {formatTimeOfDay(event.gapStartTs)}–{formatTimeOfDay(event.gapEndTs)} ·{' '}
          {project?.label ?? event.projectCode}
        </span>
      </div>

      {reassigning ? (
        <div className="idle-prompt-picker">
          {projects.map((p) => (
            <button
              key={p.code}
              type="button"
              className="idle-pick"
              onClick={() => reassign(p.code)}
            >
              <span className="project-dot" style={{ background: p.color }} />
              {p.code}
            </button>
          ))}
          <button type="button" className="btn btn--ghost" onClick={() => setReassigning(false)}>
            cancel
          </button>
        </div>
      ) : (
        <div className="idle-prompt-actions">
          <button type="button" className="btn" onClick={keep}>
            keep on {event.projectCode}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setReassigning(true)}>
            reassign
          </button>
          <button type="button" className="btn btn--ghost" onClick={discard}>
            discard
          </button>
        </div>
      )}
    </div>
  )
}

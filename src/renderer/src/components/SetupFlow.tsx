import { useState } from 'react'
import type { Project, TrackingMode } from '../../../shared/types'
import { ProjectForm } from './ProjectForm'

interface Props {
  projects: Project[]
  onProjectsChanged: () => void
}

/**
 * First-run, full-window setup: choose how tracking works, queue up charge
 * codes one at a time, then start. Projects remain editable later via
 * '+ add project'; the tracking mode via the titlebar badge.
 */
export function SetupFlow({ projects, onProjectsChanged }: Props): React.JSX.Element {
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('manual')

  const start = (): void => {
    void window.timelog.completeSetup(trackingMode)
  }

  return (
    <div className="setup">
      <header className="titlebar">
        <span className="titlebar-dots" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className="titlebar-name">timelog</span>
        <span className="mode-badge mode-badge--auto">SETUP</span>
      </header>

      <div className="setup-body">
        <h1 className="setup-title">how should time be logged?</h1>
        <div className="mode-choice" role="radiogroup" aria-label="tracking mode">
          <button
            type="button"
            role="radio"
            aria-checked={trackingMode === 'manual'}
            className={`mode-card${trackingMode === 'manual' ? ' mode-card--selected' : ''}`}
            onClick={() => setTrackingMode('manual')}
          >
            <span className="mode-card-title">manual check-in</span>
            <span className="mode-card-desc">
              You tap a project to start its clock and tap again to stop. Nothing on your screen is
              ever read.
            </span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={trackingMode === 'auto'}
            className={`mode-card${trackingMode === 'auto' ? ' mode-card--selected' : ''}`}
            onClick={() => setTrackingMode('auto')}
          >
            <span className="mode-card-title">automatic</span>
            <span className="mode-card-desc">
              Active window titles are matched to your charge codes locally. No screenshots, no
              keystrokes, no network — but it does read window titles.
            </span>
          </button>
        </div>
        <p className="setup-hint">You can switch modes anytime from the badge in the titlebar.</p>

        <h1 className="setup-title">charge codes</h1>
        <ProjectForm existing={projects} onAdded={onProjectsChanged} autoFocus />

        {projects.length > 0 && (
          <ul className="setup-queue">
            {projects.map((p) => (
              <li key={p.code} className="setup-queue-row">
                <span className="project-dot" style={{ background: p.color }} />
                <span className="project-code">{p.code}</span>
                <span className="project-label">{p.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="setup-footer">
        <button
          type="button"
          className="btn btn--primary"
          onClick={start}
          disabled={projects.length === 0}
        >
          start tracking →
        </button>
      </footer>
    </div>
  )
}

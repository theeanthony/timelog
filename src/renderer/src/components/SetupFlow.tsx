import type { Project } from '../../../shared/types'
import { ProjectForm } from './ProjectForm'

interface Props {
  projects: Project[]
  onProjectsChanged: () => void
}

/**
 * First-run, full-window setup: queue up charge codes one at a time,
 * then start tracking. Reachable again later via '+ add project'.
 */
export function SetupFlow({ projects, onProjectsChanged }: Props): React.JSX.Element {
  const start = (): void => {
    void window.timelog.completeSetup()
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
        <h1 className="setup-title">charge codes</h1>
        <p className="setup-hint">
          Add the projects you charge time to. Window titles containing a code or label are tracked
          automatically — you can always switch by tapping.
        </p>

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

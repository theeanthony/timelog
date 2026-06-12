import { useCallback, useEffect, useState } from 'react'
import type { Project } from '../../shared/types'
import { useTrackerState } from './hooks/useTrackerState'
import { Titlebar } from './components/Titlebar'
import { ClockZone } from './components/ClockZone'
import { ProjectList } from './components/ProjectList'
import { ProjectForm } from './components/ProjectForm'
import { BottomBar } from './components/BottomBar'
import { SetupFlow } from './components/SetupFlow'
import { ExportSheet } from './components/ExportSheet'

function App(): React.JSX.Element {
  const { state, nowMs } = useTrackerState()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const refreshProjects = useCallback((): void => {
    void window.timelog.listProjects().then(setProjects)
  }, [])

  useEffect(refreshProjects, [refreshProjects])

  useEffect(() => window.timelogEvents.onOpenExportDialog(() => setShowExport(true)), [])

  if (!state) {
    return <div className="app app--loading">…</div>
  }

  if (!state.setupComplete) {
    return (
      <div className="app" data-mode="auto" data-status="tracking">
        <SetupFlow projects={projects} onProjectsChanged={refreshProjects} />
      </div>
    )
  }

  return (
    <div className="app" data-mode={state.mode} data-status={state.status}>
      <Titlebar mode={state.mode} />
      <ClockZone state={state} nowMs={nowMs} />
      <div className="list-zone">
        <ProjectList projects={projects} state={state} nowMs={nowMs} />
        {showForm && (
          <div className="form-drawer">
            <ProjectForm
              existing={projects}
              onAdded={refreshProjects}
              onClose={() => setShowForm(false)}
              autoFocus
            />
          </div>
        )}
      </div>
      <BottomBar
        onAddProject={() => setShowForm((v) => !v)}
        onExport={() => setShowExport(true)}
        exportNote={null}
      />
      {showExport && <ExportSheet onClose={() => setShowExport(false)} />}
    </div>
  )
}

export default App

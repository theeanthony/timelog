import { useCallback, useEffect, useState } from 'react'
import type { Project } from '../../shared/types'
import { currentWeekStartIso } from '../../shared/week'
import { useTrackerState } from './hooks/useTrackerState'
import { Titlebar } from './components/Titlebar'
import { ClockZone } from './components/ClockZone'
import { ProjectList } from './components/ProjectList'
import { ProjectForm } from './components/ProjectForm'
import { BottomBar } from './components/BottomBar'

function App(): React.JSX.Element {
  const { state, nowMs } = useTrackerState()
  const [projects, setProjects] = useState<Project[]>([])
  const [showForm, setShowForm] = useState(false)
  const [exportNote, setExportNote] = useState<string | null>(null)

  const refreshProjects = useCallback((): void => {
    void window.timelog.listProjects().then(setProjects)
  }, [])

  useEffect(refreshProjects, [refreshProjects])

  const exportWeek = useCallback((): void => {
    void window.timelog.exportWeekCsv(currentWeekStartIso(Date.now())).then((result) => {
      if ('savedTo' in result) {
        setExportNote('saved ✓')
        setTimeout(() => setExportNote(null), 2500)
      }
    })
  }, [])

  useEffect(() => window.timelogEvents.onOpenExportDialog(exportWeek), [exportWeek])

  if (!state) {
    return <div className="app app--loading">…</div>
  }

  return (
    <div className="app" data-mode={state.mode} data-status={state.status}>
      <Titlebar mode={state.mode} />
      <ClockZone state={state} nowMs={nowMs} />
      <div className="list-zone">
        <ProjectList projects={projects} state={state} nowMs={nowMs} />
        {showForm && (
          <div className="form-drawer">
            <ProjectForm existing={projects} onAdded={refreshProjects} onClose={() => setShowForm(false)} autoFocus />
          </div>
        )}
      </div>
      <BottomBar onAddProject={() => setShowForm((v) => !v)} onExport={exportWeek} exportNote={exportNote} />
    </div>
  )
}

export default App

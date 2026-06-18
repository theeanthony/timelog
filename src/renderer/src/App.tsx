import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Project } from '../../shared/types'
import { resolveTheme, EDITABLE_VARS } from '../../shared/themes'
import { useTrackerState } from './hooks/useTrackerState'
import { usePrefs } from './hooks/usePrefs'
import { useToasts } from './hooks/useToasts'
import { useHotkeys } from './hooks/useHotkeys'
import { Titlebar } from './components/Titlebar'
import { ClockZone } from './components/ClockZone'
import { CompactBar } from './components/CompactBar'
import { PetLayer } from './components/PetLayer'
import { HabitatBackdrop } from './components/HabitatBackdrop'
import { TodaySummary } from './components/TodaySummary'
import { ProjectList } from './components/ProjectList'
import { ProjectForm } from './components/ProjectForm'
import { BottomBar } from './components/BottomBar'
import { SetupFlow } from './components/SetupFlow'
import { WeekView } from './components/WeekView'
import { Settings } from './components/Settings'
import { RulesEditor } from './components/RulesEditor'
import { DayTimeline } from './components/DayTimeline'
import { QuickSwitch } from './components/QuickSwitch'
import { Zoo } from './components/Zoo'
import { IdlePrompt } from './components/IdlePrompt'
import { Toasts } from './components/Toasts'

function App(): React.JSX.Element {
  const { state, nowMs } = useTrackerState()
  const { prefs, update } = usePrefs()
  const { toasts, push, dismiss } = useToasts()
  const [projects, setProjects] = useState<Project[]>([])

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [showExport, setShowExport] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [showQuickSwitch, setShowQuickSwitch] = useState(false)
  const [showZoo, setShowZoo] = useState(false)
  const [celebrate, setCelebrate] = useState(0)
  const [view, setView] = useState<'full' | 'compact' | 'peek'>('full')

  const refreshProjects = useCallback((): void => {
    void window.timelog.listProjects(true).then(setProjects)
  }, [])
  useEffect(refreshProjects, [refreshProjects])

  // Tray actions should pop the full panel back open if it's minimized.
  useEffect(
    () =>
      window.timelogEvents.onOpenExportDialog(() => {
        setView('full')
        setShowExport(true)
      }),
    []
  )
  useEffect(
    () =>
      window.timelogEvents.onOpenSettings(() => {
        setView('full')
        setShowSettings(true)
      }),
    []
  )

  // Keep the OS window size in sync with the view (full / minimized bar / peek).
  useEffect(() => {
    void window.timelog.setPanelView(view)
  }, [view])

  // Apply the theme to the document root: set the dark/light baseline + inject
  // preset/custom variable overrides. Reacts to OS changes when 'system'.
  useEffect(() => {
    const root = document.documentElement
    const apply = (): void => {
      const { base, vars } = resolveTheme(prefs?.theme ?? 'dark', prefs?.customColors ?? {})
      root.dataset.theme = base
      for (const { var: name } of EDITABLE_VARS) root.style.removeProperty(name)
      for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
    }
    apply()
    if (prefs?.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [prefs?.theme, prefs?.customColors])

  const liveProjects = useMemo(() => projects.filter((p) => !p.archived), [projects])

  const closeTopOverlay = useCallback((): void => {
    if (showZoo) setShowZoo(false)
    else if (showQuickSwitch) setShowQuickSwitch(false)
    else if (showSettings) setShowSettings(false)
    else if (showRules) setShowRules(false)
    else if (showTimeline) setShowTimeline(false)
    else if (showExport) setShowExport(false)
    else if (showForm || editing) {
      setShowForm(false)
      setEditing(null)
    }
  }, [
    showZoo,
    showQuickSwitch,
    showSettings,
    showRules,
    showTimeline,
    showExport,
    showForm,
    editing
  ])

  const hotkeys = useMemo(
    () => ({
      onToggle: () => {
        if (!state) return
        if (state.activeProject) void window.timelog.clearOverride()
        else if (liveProjects[0]) void window.timelog.setManualOverride(liveProjects[0].code)
      },
      onSwitchIndex: (i: number) => {
        const p = liveProjects[i]
        if (p) void window.timelog.setManualOverride(p.code)
      },
      onQuickSwitch: () => setShowQuickSwitch(true),
      onExport: () => setShowExport(true),
      onSettings: () => setShowSettings(true),
      onAdd: () => {
        setEditing(null)
        setShowForm(true)
      },
      onEscape: () => {
        closeTopOverlay()
      }
    }),
    [state, liveProjects, closeTopOverlay]
  )
  useHotkeys(hotkeys)

  if (!state) {
    return <div className="app app--loading">…</div>
  }

  if (!state.setupComplete) {
    return (
      <div className="app" data-mode="auto" data-status="tracking">
        <SetupFlow projects={liveProjects} onProjectsChanged={refreshProjects} />
      </div>
    )
  }

  const idleEvent = state.pendingIdle[0] ?? null
  const drawerOpen = showForm || editing !== null

  if (view !== 'full') {
    return (
      <div className="app app--compact" data-mode={state.mode} data-status={state.status}>
        <CompactBar
          state={state}
          nowMs={nowMs}
          view={view}
          onPeek={() => setView('peek')}
          onCollapse={() => setView('compact')}
          onRestore={() => setView('full')}
        />
      </div>
    )
  }

  return (
    <div className="app" data-mode={state.mode} data-status={state.status}>
      {prefs && (
        <HabitatBackdrop
          habitat={prefs.activeHabitat}
          hour={prefs.dayNightHour ?? new Date(nowMs).getHours()}
          diorama={prefs.petsEnabled && prefs.dioramaOnPanel}
          state={state}
          nowMs={nowMs}
          longRunHours={prefs.longRunHours}
          density={prefs.dioramaDensity}
        />
      )}
      <Titlebar
        mode={state.mode}
        trackingMode={state.trackingMode}
        onOpenSettings={() => setShowSettings(true)}
        onMinimize={() => setView('compact')}
      />
      <div className="clock-wrap">
        <ClockZone
          state={state}
          nowMs={nowMs}
          projects={projects}
          onChanged={refreshProjects}
          onOpenRules={() => setShowRules(true)}
        />
      </div>
      <TodaySummary
        projects={projects}
        state={state}
        nowMs={nowMs}
        onOpenTimeline={() => setShowTimeline(true)}
      />
      {idleEvent && (
        <IdlePrompt event={idleEvent} projects={liveProjects} onResolved={() => undefined} />
      )}
      <div className="list-zone">
        <ProjectList
          projects={projects}
          state={state}
          nowMs={nowMs}
          onEditProject={(p) => {
            setEditing(p)
            setShowForm(false)
          }}
          onAddProject={() => setShowForm(true)}
          onChanged={refreshProjects}
        />
        {drawerOpen && (
          <div className="form-drawer">
            <ProjectForm
              existing={projects}
              project={editing ?? undefined}
              onAdded={refreshProjects}
              onClose={() => {
                setShowForm(false)
                setEditing(null)
              }}
              autoFocus
            />
          </div>
        )}
      </div>
      <BottomBar
        onAddProject={() => {
          setEditing(null)
          setShowForm((v) => !v)
        }}
        onTimeline={() => setShowTimeline(true)}
        onExport={() => setShowExport(true)}
        onZoo={() => setShowZoo(true)}
        exportNote={null}
      />

      {prefs?.petsEnabled && (prefs.party.length > 0 || prefs.pets.length > 0) && (
        <PetLayer
          pets={prefs.pets}
          customPets={prefs.customPets}
          party={prefs.party}
          state={state}
          nowMs={nowMs}
          longRunHours={prefs.longRunHours}
          celebrate={celebrate}
        />
      )}

      {showExport && (
        <WeekView
          projects={projects}
          state={state}
          nowMs={nowMs}
          onClose={() => setShowExport(false)}
          onCelebrate={() => setCelebrate((n) => n + 1)}
        />
      )}
      {showTimeline && (
        <DayTimeline
          projects={liveProjects}
          nowMs={nowMs}
          onClose={() => setShowTimeline(false)}
          onToast={push}
        />
      )}
      {showSettings && prefs && (
        <Settings
          prefs={prefs}
          update={update}
          onOpenRules={() => {
            setShowSettings(false)
            setShowRules(true)
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
      {showRules && <RulesEditor projects={liveProjects} onClose={() => setShowRules(false)} />}
      {showQuickSwitch && (
        <QuickSwitch projects={projects} state={state} onClose={() => setShowQuickSwitch(false)} />
      )}
      {showZoo && prefs && <Zoo prefs={prefs} update={update} onClose={() => setShowZoo(false)} />}
      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

export default App

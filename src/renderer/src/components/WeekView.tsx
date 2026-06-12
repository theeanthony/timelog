import { useEffect, useMemo, useState } from 'react'
import type { Project, TrackerState, WeekBreakdown } from '../../../shared/types'
import { currentWeekStartIso } from '../../../shared/week'
import { formatShort } from '../hooks/useTrackerState'

interface Props {
  projects: Project[]
  state: TrackerState
  nowMs: number
  onClose: () => void
}

const DAY_LETTERS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function shiftWeek(weekStartIso: string, weeks: number): string {
  const [y, m, d] = weekStartIso.split('-').map(Number)
  const date = new Date(y, m - 1, d + weeks * 7)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function localDateIso(epochMs: number): string {
  const d = new Date(epochMs)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** '7.5h' style compact hours for the column footers. */
function formatHours(ms: number): string {
  if (ms <= 0) return '—'
  const h = ms / 3_600_000
  const rounded = Math.round(h * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}h`
}

export function WeekView({ projects, state, nowMs, onClose }: Props): React.JSX.Element {
  const [thisWeek] = useState(() => currentWeekStartIso(Date.now()))
  const [weekStart, setWeekStart] = useState(thisWeek)
  const [breakdown, setBreakdown] = useState<WeekBreakdown | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>(() => localDateIso(Date.now()))
  const [note, setNote] = useState<string | null>(null)

  const refreshKey = Math.floor(nowMs / 30_000) // refetch closed totals every 30s while open
  useEffect(() => {
    let stale = false
    void window.timelog.getWeekBreakdown(weekStart).then((b) => {
      if (!stale) setBreakdown(b)
    })
    return () => {
      stale = true
    }
  }, [weekStart, refreshKey])

  const colorByCode = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.code, p.color])),
    [projects]
  )
  const labelByCode = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.code, p.label])),
    [projects]
  )

  // Merge the live open session into its day so "today so far" is honest.
  const days = useMemo(() => {
    if (!breakdown) return null
    const merged = breakdown.days.map((d) => ({
      ...d,
      msByProject: { ...d.msByProject }
    }))
    const open = state.openSessionStartTs
    const code = state.activeProject?.code
    if (open !== null && code) {
      const todayIso = localDateIso(nowMs)
      const day = merged.find((d) => d.dateIso === todayIso)
      if (day) {
        const todayStart = new Date(nowMs)
        todayStart.setHours(0, 0, 0, 0)
        const liveMs = Math.max(0, nowMs - Math.max(open, todayStart.getTime()))
        day.msByProject[code] = (day.msByProject[code] ?? 0) + liveMs
        day.totalMs += liveMs
      }
    }
    return merged
  }, [breakdown, state.openSessionStartTs, state.activeProject?.code, nowMs])

  const maxDayMs = days ? Math.max(3_600_000, ...days.map((d) => d.totalMs)) : 1
  const weekTotalMs = days?.reduce((acc, d) => acc + d.totalMs, 0) ?? 0
  const selected = days?.find((d) => d.dateIso === selectedDay) ?? null
  const selectedRows = selected
    ? Object.entries(selected.msByProject).sort((a, b) => b[1] - a[1])
    : []

  const flash = (msg: string): void => {
    setNote(msg)
    setTimeout(() => setNote(null), 2200)
  }

  const save = async (): Promise<void> => {
    const result = await window.timelog.exportWeekCsv(weekStart)
    if ('savedTo' in result) flash('saved ✓')
  }

  const copy = async (): Promise<void> => {
    await window.timelog.copyWeekCsv(weekStart)
    flash('copied ✓')
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet sheet--week" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button
            type="button"
            className="btn--icon"
            onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
          >
            ‹
          </button>
          <span className="sheet-title">
            week of {weekStart} · {formatShort(weekTotalMs)}
          </span>
          <button
            type="button"
            className="btn--icon"
            onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            disabled={weekStart >= thisWeek}
          >
            ›
          </button>
        </div>

        <div className="week-chart">
          {days?.map((d, i) => (
            <button
              key={d.dateIso}
              type="button"
              className={`week-col${d.dateIso === selectedDay ? ' week-col--selected' : ''}`}
              onClick={() => setSelectedDay(d.dateIso)}
            >
              <span className="week-bar">
                {Object.entries(d.msByProject).map(([code, ms]) => (
                  <i
                    key={code}
                    style={{
                      height: `${(ms / maxDayMs) * 100}%`,
                      background: colorByCode[code] ?? '#5a5766'
                    }}
                    title={`${code} ${formatShort(ms)}`}
                  />
                ))}
              </span>
              <span className="week-day">{DAY_LETTERS[i]}</span>
              <span className="week-hours">{formatHours(d.totalMs)}</span>
            </button>
          ))}
        </div>

        <div className="sheet-rows">
          {selected && selectedRows.length === 0 && (
            <div className="sheet-empty">nothing logged on {selected.dateIso}</div>
          )}
          {selectedRows.map(([code, ms]) => (
            <div key={code} className="sheet-row">
              <span className="project-code">
                <i className="project-dot" style={{ background: colorByCode[code] ?? '#5a5766' }} />{' '}
                {code}
              </span>
              <span className="project-label">{labelByCode[code] ?? ''}</span>
              <span className="project-total">{formatShort(ms)}</span>
            </div>
          ))}
        </div>

        <div className="sheet-actions">
          <span className="export-note">{note}</span>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            close
          </button>
          <button type="button" className="btn" onClick={copy} disabled={weekTotalMs === 0}>
            copy csv
          </button>
          <button type="button" className="btn" onClick={save} disabled={weekTotalMs === 0}>
            save csv
          </button>
        </div>
      </div>
    </div>
  )
}

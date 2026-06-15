import { useEffect, useMemo, useState } from 'react'
import type { Project, RangeUnit, TrackerState, RangeBreakdown } from '../../../shared/types'
import {
  currentWeekStartIso,
  daysInMonth,
  monthStartIso,
  shiftMonthIso
} from '../../../shared/week'
import { formatHours, formatShort } from '../hooks/useTrackerState'

interface Props {
  projects: Project[]
  state: TrackerState
  nowMs: number
  onClose: () => void
  /** Fired on a successful export so the pets can celebrate. */
  onCelebrate?: () => void
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

export function WeekView({
  projects,
  state,
  nowMs,
  onClose,
  onCelebrate
}: Props): React.JSX.Element {
  const [unit, setUnit] = useState<RangeUnit>('week')
  const [view, setView] = useState<'chart' | 'totals'>('chart')
  const [weekStart, setWeekStart] = useState(() => currentWeekStartIso(Date.now()))
  const [monthStart, setMonthStart] = useState(() => monthStartIso(Date.now()))
  const [breakdown, setBreakdown] = useState<RangeBreakdown | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>(() => localDateIso(Date.now()))
  const [note, setNote] = useState<string | null>(null)

  const startIso = unit === 'week' ? weekStart : monthStart
  const numDays = unit === 'week' ? 7 : daysInMonth(monthStart)
  const thisWeek = currentWeekStartIso(nowMs)
  const thisMonth = monthStartIso(nowMs)
  const atLatest = unit === 'week' ? weekStart >= thisWeek : monthStart >= thisMonth

  const refreshKey = Math.floor(nowMs / 30_000)
  useEffect(() => {
    let stale = false
    void window.timelog.getRangeBreakdown(unit, startIso, numDays).then((b) => {
      if (!stale) setBreakdown(b)
    })
    return () => {
      stale = true
    }
  }, [unit, startIso, numDays, refreshKey])

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
    const merged = breakdown.days.map((d) => ({ ...d, msByProject: { ...d.msByProject } }))
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
  const rangeTotalMs = days?.reduce((acc, d) => acc + d.totalMs, 0) ?? 0
  const selected = days?.find((d) => d.dateIso === selectedDay) ?? null
  const selectedRows = selected
    ? Object.entries(selected.msByProject).sort((a, b) => b[1] - a[1])
    : []

  const flash = (msg: string): void => {
    setNote(msg)
    setTimeout(() => setNote(null), 2200)
  }

  const stepRange = (dir: number): void => {
    if (unit === 'week') setWeekStart((w) => shiftWeek(w, dir))
    else setMonthStart((m) => shiftMonthIso(m, dir))
  }

  const save = async (): Promise<void> => {
    const result = await window.timelog.exportRangeCsv(unit, startIso, numDays)
    if ('savedTo' in result) {
      flash('saved ✓')
      onCelebrate?.()
    }
  }
  const copy = async (): Promise<void> => {
    await window.timelog.copyRangeCsv(unit, startIso, numDays)
    flash('copied ✓')
    onCelebrate?.()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet sheet--week"
        role="dialog"
        aria-label="time report"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <button
            type="button"
            className="btn--icon"
            aria-label="previous"
            onClick={() => stepRange(-1)}
          >
            ‹
          </button>
          <span className="sheet-title">
            {unit === 'week' ? `week of ${weekStart}` : monthStart.slice(0, 7)} ·{' '}
            {formatShort(rangeTotalMs)}
          </span>
          <button
            type="button"
            className="btn--icon"
            aria-label="next"
            onClick={() => stepRange(1)}
            disabled={atLatest}
          >
            ›
          </button>
        </div>

        <div className="report-tabs">
          <div className="seg" role="tablist" aria-label="range unit">
            <button
              type="button"
              className={`seg-btn${unit === 'week' ? ' seg-btn--on' : ''}`}
              onClick={() => setUnit('week')}
            >
              week
            </button>
            <button
              type="button"
              className={`seg-btn${unit === 'month' ? ' seg-btn--on' : ''}`}
              onClick={() => setUnit('month')}
            >
              month
            </button>
          </div>
          <div className="seg" role="tablist" aria-label="view">
            <button
              type="button"
              className={`seg-btn${view === 'chart' ? ' seg-btn--on' : ''}`}
              onClick={() => setView('chart')}
            >
              chart
            </button>
            <button
              type="button"
              className={`seg-btn${view === 'totals' ? ' seg-btn--on' : ''}`}
              onClick={() => setView('totals')}
            >
              totals
            </button>
          </div>
        </div>

        {view === 'chart' ? (
          <>
            <div className={`week-chart${unit === 'month' ? ' week-chart--month' : ''}`}>
              {days?.map((d, i) => (
                <button
                  key={d.dateIso}
                  type="button"
                  className={`week-col${d.dateIso === selectedDay ? ' week-col--selected' : ''}`}
                  onClick={() => setSelectedDay(d.dateIso)}
                  title={`${d.dateIso} · ${formatShort(d.totalMs)}`}
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
                  <span className="week-day">
                    {unit === 'week' ? DAY_LETTERS[i] : new Date(d.dateIso).getDate()}
                  </span>
                  {unit === 'week' && <span className="week-hours">{formatHours(d.totalMs)}</span>}
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
                    <i
                      className="project-dot"
                      style={{ background: colorByCode[code] ?? '#5a5766' }}
                    />{' '}
                    {code}
                  </span>
                  <span className="project-label">{labelByCode[code] ?? ''}</span>
                  <span className="project-total">{formatShort(ms)}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="sheet-rows">
            {(!breakdown || breakdown.totals.length === 0) && (
              <div className="sheet-empty">nothing logged this {unit}</div>
            )}
            {breakdown?.totals.map((r) => (
              <div key={r.code} className="sheet-row">
                <span className="project-code">
                  <i
                    className="project-dot"
                    style={{ background: colorByCode[r.code] ?? '#5a5766' }}
                  />{' '}
                  {r.code}
                </span>
                <span className="project-label">{r.label}</span>
                <span className="project-total">{formatShort(r.totalMs)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="sheet-actions">
          <span className="export-note">{note}</span>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            close
          </button>
          <button type="button" className="btn" onClick={copy} disabled={rangeTotalMs === 0}>
            copy csv
          </button>
          <button type="button" className="btn" onClick={save} disabled={rangeTotalMs === 0}>
            save csv
          </button>
        </div>
      </div>
    </div>
  )
}

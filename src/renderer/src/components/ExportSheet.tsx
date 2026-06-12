import { useEffect, useState } from 'react'
import type { WeekTotals } from '../../../shared/types'
import { currentWeekStartIso } from '../../../shared/week'
import { formatShort } from '../hooks/useTrackerState'

interface Props {
  onClose: () => void
}

function shiftWeek(weekStartIso: string, weeks: number): string {
  const [y, m, d] = weekStartIso.split('-').map(Number)
  const date = new Date(y, m - 1, d + weeks * 7)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function ExportSheet({ onClose }: Props): React.JSX.Element {
  const [thisWeek] = useState(() => currentWeekStartIso(Date.now()))
  const [weekStart, setWeekStart] = useState(thisWeek)
  const [totals, setTotals] = useState<WeekTotals | null>(null)
  const [note, setNote] = useState<string | null>(null)

  useEffect(() => {
    let stale = false
    void window.timelog.getWeekTotals(weekStart).then((t) => {
      if (!stale) setTotals(t)
    })
    return () => {
      stale = true
    }
  }, [weekStart])

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

  const grandTotalMs = totals?.rows.reduce((acc, r) => acc + r.totalMs, 0) ?? 0

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <button
            type="button"
            className="btn--icon"
            onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
          >
            ‹
          </button>
          <span className="sheet-title">week of {weekStart}</span>
          <button
            type="button"
            className="btn--icon"
            onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
            disabled={weekStart >= thisWeek}
          >
            ›
          </button>
        </div>

        <div className="sheet-rows">
          {totals === null && <div className="sheet-empty">…</div>}
          {totals !== null && totals.rows.length === 0 && (
            <div className="sheet-empty">no time logged this week</div>
          )}
          {totals?.rows.map((r) => (
            <div key={r.code} className="sheet-row">
              <span className="project-code">{r.code}</span>
              <span className="project-label">{r.label}</span>
              <span className="project-total">
                {r.hours}h {String(r.minutes).padStart(2, '0')}m
              </span>
            </div>
          ))}
          {totals !== null && totals.rows.length > 0 && (
            <div className="sheet-row sheet-row--total">
              <span className="project-code">total</span>
              <span className="project-label" />
              <span className="project-total">{formatShort(grandTotalMs)}</span>
            </div>
          )}
        </div>

        <div className="sheet-actions">
          <span className="export-note">{note}</span>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            close
          </button>
          <button type="button" className="btn" onClick={copy} disabled={!totals?.rows.length}>
            copy csv
          </button>
          <button type="button" className="btn" onClick={save} disabled={!totals?.rows.length}>
            save csv
          </button>
        </div>
      </div>
    </div>
  )
}

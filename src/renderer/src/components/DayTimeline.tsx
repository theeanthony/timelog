import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Project, Session } from '../../../shared/types'
import { formatShort, formatTimeOfDay } from '../hooks/useTrackerState'

interface Props {
  projects: Project[]
  nowMs: number
  onClose: () => void
  onToast: (message: string, undo?: () => void) => void
}

function startOfDay(d: Date): number {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function isoDate(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Build a timestamp on `dayMs` from an "HH:MM" string. */
function tsFromTime(dayMs: number, hhmm: string): number | null {
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return dayMs + (h * 60 + m) * 60_000
}

/**
 * Today's (or any day's) sessions as an editable list — reassign, split, or
 * delete a block, plus a "log time I forgot" manual entry. The reviewed time
 * flows straight back into totals and the week/month reports.
 */
export function DayTimeline({ projects, nowMs, onClose, onToast }: Props): React.JSX.Element {
  const [dayMs, setDayMs] = useState(() => startOfDay(new Date()))
  const [sessions, setSessions] = useState<Session[]>([])
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [addCode, setAddCode] = useState(projects[0]?.code ?? '')

  const refreshKey = Math.floor(nowMs / 30_000)
  const refresh = useCallback((): void => {
    void window.timelog.listDaySessions(dayMs).then(setSessions)
  }, [dayMs])
  useEffect(refresh, [refresh, refreshKey])

  const projMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.code, p])), [projects])
  const dayStart = dayMs
  const dayEnd = dayMs + 24 * 60 * 60 * 1000
  const today = isoDate(dayMs) === isoDate(nowMs)

  const reassign = async (s: Session, code: string): Promise<void> => {
    await window.timelog.reassignSession(s.id, code)
    refresh()
  }

  const remove = async (s: Session): Promise<void> => {
    await window.timelog.deleteSession(s.id)
    refresh()
    onToast('block deleted', async () => {
      if (s.endTs !== null) await window.timelog.addManualSession(s.projectCode, s.startTs, s.endTs)
      refresh()
    })
  }

  const split = async (s: Session): Promise<void> => {
    if (s.endTs === null) return
    const mid = Math.round((s.startTs + s.endTs) / 2)
    await window.timelog.splitSession(s.id, mid)
    refresh()
  }

  const addManual = async (): Promise<void> => {
    const s = tsFromTime(dayMs, start)
    const e = tsFromTime(dayMs, end)
    if (s === null || e === null || e <= s || !addCode) {
      onToast('enter a valid time range')
      return
    }
    const id = await window.timelog.addManualSession(addCode, s, e)
    if (id === null) onToast('that range was rejected (too long / invalid)')
    else onToast('time added')
    refresh()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet sheet--timeline"
        role="dialog"
        aria-label="day timeline"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <button
            type="button"
            className="btn--icon"
            aria-label="previous day"
            onClick={() =>
              setDayMs((d) => startOfDay(new Date(new Date(d).setDate(new Date(d).getDate() - 1))))
            }
          >
            ‹
          </button>
          <span className="sheet-title">{today ? 'today' : isoDate(dayMs)}</span>
          <button
            type="button"
            className="btn--icon"
            aria-label="next day"
            disabled={dayEnd > nowMs}
            onClick={() =>
              setDayMs((d) => startOfDay(new Date(new Date(d).setDate(new Date(d).getDate() + 1))))
            }
          >
            ›
          </button>
        </div>

        <div className="sheet-rows">
          {sessions.length === 0 && <div className="sheet-empty">nothing logged this day</div>}
          {sessions.map((s) => {
            const from = Math.max(s.startTs, dayStart)
            const to = Math.min(s.endTs ?? nowMs, dayEnd)
            return (
              <div key={s.id} className="tl-row">
                <span className="tl-time">
                  {formatTimeOfDay(from)}–{formatTimeOfDay(to)}
                </span>
                <select
                  className="input input--select tl-proj"
                  value={s.projectCode}
                  onChange={(e) => void reassign(s, e.target.value)}
                  aria-label="reassign session"
                  style={{ borderColor: projMap[s.projectCode]?.color }}
                >
                  {projects.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.code}
                    </option>
                  ))}
                </select>
                <span className="tl-dur">{formatShort(to - from)}</span>
                <button
                  type="button"
                  className="btn--icon"
                  title="split in half"
                  aria-label="split session"
                  onClick={() => void split(s)}
                >
                  ⊟
                </button>
                <button
                  type="button"
                  className="btn--icon"
                  title="delete block"
                  aria-label="delete session"
                  onClick={() => void remove(s)}
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        <div className="tl-add">
          <span className="tl-add-label">log time</span>
          <select
            className="input input--select"
            value={addCode}
            onChange={(e) => setAddCode(e.target.value)}
            aria-label="project for manual entry"
          >
            {projects.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>
          <input
            className="input input--time"
            type="time"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            aria-label="start time"
          />
          <input
            className="input input--time"
            type="time"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            aria-label="end time"
          />
          <button type="button" className="btn" onClick={addManual}>
            add
          </button>
        </div>
      </div>
    </div>
  )
}

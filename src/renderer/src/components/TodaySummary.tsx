import { useMemo } from 'react'
import type { Project, TrackerState } from '../../../shared/types'
import { formatShort, todayTotalMs } from '../hooks/useTrackerState'

interface Props {
  projects: Project[]
  state: TrackerState
  nowMs: number
  onOpenTimeline: () => void
}

/** Compact "today" strip: total logged + the top project, opens the timeline. */
export function TodaySummary({ projects, state, nowMs, onOpenTimeline }: Props): React.JSX.Element {
  const { totalMs, top } = useMemo(() => {
    let totalMs = 0
    let top: { project: Project; ms: number } | null = null
    for (const p of projects) {
      const ms = todayTotalMs(state, p.code, nowMs)
      if (ms <= 0) continue
      totalMs += ms
      if (!top || ms > top.ms) top = { project: p, ms }
    }
    return { totalMs, top }
  }, [projects, state, nowMs])

  return (
    <button
      type="button"
      className="today-summary"
      onClick={onOpenTimeline}
      title="View today's timeline"
    >
      <span className="today-label">today</span>
      <span className="today-total">{formatShort(totalMs)}</span>
      {top && (
        <span className="today-top">
          <span className="project-dot" style={{ background: top.project.color }} />
          {top.project.code}
        </span>
      )}
      <span className="today-chevron" aria-hidden>
        ▤
      </span>
    </button>
  )
}

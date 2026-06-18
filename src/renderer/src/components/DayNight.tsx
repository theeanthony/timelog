import type { CSSProperties } from 'react'
import { tintForHour } from '../../../shared/daynight'

/**
 * Time-of-day lighting: a colour wash multiplied over a habitat scene. `hour` is
 * 0–24 (the app passes the real clock hour, or a forced value the user picked).
 * Renders nothing at midday (clear).
 */
export function DayNight({ hour }: { hour: number }): React.JSX.Element | null {
  const t = tintForHour(hour)
  if (t.opacity <= 0.001) return null
  return (
    <div
      className="daynight"
      aria-hidden
      style={{ background: t.color, opacity: t.opacity } as CSSProperties}
    />
  )
}

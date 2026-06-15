/** Shared duration formatters used by both the main process and the renderer. */

export function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

/** '7.5h' style compact decimal hours. */
export function formatHours(ms: number): string {
  if (ms <= 0) return '—'
  const h = ms / 3_600_000
  const rounded = Math.round(h * 10) / 10
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}h`
}

/** 'HH:MM' local clock time for a timestamp (timeline labels). */
export function formatTimeOfDay(epochMs: number): string {
  const d = new Date(epochMs)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

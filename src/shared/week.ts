const pad2 = (n: number): string => String(n).padStart(2, '0')

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

/** Monday of the week containing epochMs, as 'YYYY-MM-DD' (local). */
export function currentWeekStartIso(epochMs: number): string {
  const d = new Date(epochMs)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() - ((dow + 6) % 7))
  return isoOf(d)
}

/** First day of the month containing epochMs, as 'YYYY-MM-DD' (local). */
export function monthStartIso(epochMs: number): string {
  const d = new Date(epochMs)
  return isoOf(new Date(d.getFullYear(), d.getMonth(), 1))
}

/** Number of days in the month that startIso (a month's first day) belongs to. */
export function daysInMonth(monthStartIsoStr: string): number {
  const [y, m] = monthStartIsoStr.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

/** Shift a 'YYYY-MM-DD' first-of-month by a number of months. */
export function shiftMonthIso(monthStartIsoStr: string, months: number): string {
  const [y, m] = monthStartIsoStr.split('-').map(Number)
  return isoOf(new Date(y, m - 1 + months, 1))
}

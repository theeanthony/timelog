/** Monday of the week containing epochMs, as 'YYYY-MM-DD' (local). */
export function currentWeekStartIso(epochMs: number): string {
  const d = new Date(epochMs)
  d.setHours(0, 0, 0, 0)
  const dow = d.getDay() // 0 = Sunday
  d.setDate(d.getDate() - ((dow + 6) % 7))
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

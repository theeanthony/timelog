/**
 * Time-of-day lighting for the habitat scenes. Maps an hour (0–24, fractional
 * allowed) to a colour-tint overlay that's multiplied over the scene: deep blue
 * at night, warm pink at dawn, clear by midday, orange→violet at dusk. Pure +
 * asset-free so it can be unit-tested; the renderer paints the result.
 */
export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk'

interface TintKey {
  h: number
  rgb: [number, number, number]
  o: number
}

// Anchors around the clock; tintForHour lerps between the two surrounding ones.
const KEYS: TintKey[] = [
  { h: 0, rgb: [10, 20, 48], o: 0.62 }, // deep night
  { h: 5, rgb: [26, 42, 85], o: 0.5 }, // pre-dawn
  { h: 7, rgb: [232, 160, 168], o: 0.34 }, // dawn glow
  { h: 9, rgb: [255, 240, 208], o: 0.06 }, // early morning
  { h: 13, rgb: [255, 255, 255], o: 0 }, // midday — clear
  { h: 17, rgb: [255, 224, 176], o: 0.08 }, // afternoon warmth
  { h: 19, rgb: [232, 132, 60], o: 0.3 }, // dusk orange
  { h: 21, rgb: [74, 48, 112], o: 0.46 }, // twilight violet
  { h: 24, rgb: [10, 20, 48], o: 0.62 } // wraps back to night
]

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export function phaseForHour(hour: number): DayPhase {
  const h = ((hour % 24) + 24) % 24
  if (h < 5 || h >= 21) return 'night'
  if (h < 8) return 'dawn'
  if (h < 18) return 'day'
  return 'dusk'
}

const PHASE_LABEL: Record<DayPhase, string> = {
  night: 'night',
  dawn: 'dawn',
  day: 'day',
  dusk: 'dusk'
}

export interface DayTint {
  /** CSS colour for the multiply overlay. */
  color: string
  /** Overlay opacity (0 = clear midday). */
  opacity: number
  phase: DayPhase
  label: string
}

export function tintForHour(hour: number): DayTint {
  const h = ((hour % 24) + 24) % 24
  let lo = KEYS[0]
  let hi = KEYS[KEYS.length - 1]
  for (let i = 0; i < KEYS.length - 1; i++) {
    if (h >= KEYS[i].h && h <= KEYS[i + 1].h) {
      lo = KEYS[i]
      hi = KEYS[i + 1]
      break
    }
  }
  const t = hi.h === lo.h ? 0 : (h - lo.h) / (hi.h - lo.h)
  const r = Math.round(lerp(lo.rgb[0], hi.rgb[0], t))
  const g = Math.round(lerp(lo.rgb[1], hi.rgb[1], t))
  const b = Math.round(lerp(lo.rgb[2], hi.rgb[2], t))
  const phase = phaseForHour(h)
  return {
    color: `rgb(${r}, ${g}, ${b})`,
    opacity: Math.round(lerp(lo.o, hi.o, t) * 1000) / 1000,
    phase,
    label: PHASE_LABEL[phase]
  }
}

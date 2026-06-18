import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { Habitat } from '../../../shared/types'
import { habitatAmbient, type AmbientKind } from '../../../shared/habitat-ambient'

/**
 * A field of small CSS-animated particles painted over a habitat scene to make
 * it feel alive — fireflies drifting, bubbles rising, snow falling, embers, etc.
 * Purely decorative (pointer-events: none); the animation lives in CSS keyed off
 * the `ambient--<kind>` class. Particle placement/timing is randomised once.
 */
const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo)

function particleStyle(kind: AmbientKind, color: string): CSSProperties {
  const size =
    kind === 'twinkle' || kind === 'dust'
      ? rand(1.5, 3)
      : kind === 'snow'
        ? rand(2, 4)
        : rand(2.5, 5)
  const dur =
    kind === 'ember'
      ? rand(2.2, 4)
      : kind === 'bubble'
        ? rand(4, 7)
        : kind === 'snow'
          ? rand(6, 11)
          : kind === 'spore'
            ? rand(7, 13)
            : kind === 'dust'
              ? rand(8, 15)
              : kind === 'twinkle'
                ? rand(2, 4.5)
                : rand(4, 8) // firefly
  return {
    left: `${rand(2, 96)}%`,
    top: `${rand(4, 96)}%`,
    width: `${size}px`,
    height: `${size}px`,
    background: color,
    color, // for the glow box-shadow on fireflies/embers
    animationDuration: `${dur}s`,
    animationDelay: `${-rand(0, dur)}s`
  }
}

export function AmbientLayer({
  habitat,
  density = 1
}: {
  habitat: Habitat
  density?: number
}): React.JSX.Element {
  const a = habitatAmbient(habitat)
  const n = Math.max(1, Math.round(a.count * density))
  const parts = useMemo(
    () => Array.from({ length: n }, () => particleStyle(a.kind, a.color)),
    [a.kind, a.color, n]
  )
  return (
    <div className={`ambient ambient--${a.kind}`} aria-hidden>
      {parts.map((style, i) => (
        <span key={i} style={style} />
      ))}
    </div>
  )
}

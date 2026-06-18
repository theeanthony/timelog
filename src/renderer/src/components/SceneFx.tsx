import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Habitat } from '../../../shared/types'
import { habitatAmbient } from '../../../shared/habitat-ambient'

/**
 * Tap-to-interact layer for a habitat scene: clicking anywhere (that isn't a
 * critter) sends a ripple out from the touch point, tinted to the biome. Sits
 * under the critters (which have their own pointer handling) so it only catches
 * taps on the scene itself.
 */
interface Ripple {
  id: number
  x: number
  y: number
}

// Module counter — Date.now()/Math.random() are unavailable in shared code, and
// a monotonic id is all we need for React keys here.
let nextId = 0

export function SceneFx({ habitat }: { habitat: Habitat }): React.JSX.Element {
  const [ripples, setRipples] = useState<Ripple[]>([])
  const color = habitatAmbient(habitat).color

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    const id = ++nextId
    setRipples((rs) => [...rs, { id, x, y }])
    window.setTimeout(() => setRipples((rs) => rs.filter((p) => p.id !== id)), 700)
  }

  return (
    <div
      className="scene-fx"
      onPointerDown={onPointerDown}
      style={{ '--fx-color': color } as CSSProperties}
      aria-hidden
    >
      {ripples.map((p) => (
        <span key={p.id} className="scene-fx-ripple" style={{ left: `${p.x}%`, top: `${p.y}%` }} />
      ))}
    </div>
  )
}

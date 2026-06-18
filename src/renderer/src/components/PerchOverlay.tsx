import type { Habitat } from '../../../shared/types'
import { habitatPerches } from '../../../shared/habitat-perches'

/**
 * Invisible, scene-aligned perch zones for a habitat. Uses the SAME 320×480
 * viewBox + `slice` as the scene art, so each `data-perch` rect lands pixel-exact
 * on its painted prop. PetLayer's scanner finds these by `[data-perch]` (scoped
 * to whatever container it's mounted in) and measures them with
 * getBoundingClientRect — which honours the slice cropping for free.
 */
export function PerchOverlay({ habitat }: { habitat: Habitat }): React.JSX.Element | null {
  const perches = habitatPerches(habitat)
  if (perches.length === 0) return null
  return (
    <svg
      className="habitat-perches"
      viewBox="0 0 320 480"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {perches.map((p, i) => (
        <rect key={i} data-perch="" x={p.x} y={p.y} width={p.w} height={p.h} fill="none" />
      ))}
    </svg>
  )
}

import type { Habitat, TrackerState } from '../../../shared/types'
import { habitatTheme } from '../../../shared/habitats'
import { PerchOverlay } from './PerchOverlay'
import { AmbientLayer } from './AmbientLayer'
import { DayNight } from './DayNight'
import { DioramaLayer } from './DioramaLayer'

/**
 * The active habitat's ambient backdrop, painted behind everything on the panel
 * (z-index below the UI, which is transparent so the scene shows through). Pets
 * roam over it and perch on its props. The scene markup is trusted built-in art,
 * injected directly. An ambient particle layer adds motion; PerchOverlay paints
 * the invisible perch zones that PetLayer's scanner discovers.
 *
 * When `diorama` is set, the biome's wild residents also roam the scene and
 * perform on its props, with periodic environment events — all behind the UI and
 * non-interactive (the user's party companions stay the interactive foreground).
 */
export function HabitatBackdrop({
  habitat,
  hour,
  diorama = false,
  state,
  nowMs,
  longRunHours,
  density = 1
}: {
  habitat: Habitat
  hour: number
  diorama?: boolean
  state?: TrackerState
  nowMs?: number
  longRunHours?: number
  density?: number
}): React.JSX.Element {
  const theme = habitatTheme(habitat)
  return (
    <div className="habitat-backdrop" style={{ background: theme.background }} aria-hidden>
      {theme.scene && (
        <span className="habitat-scene" dangerouslySetInnerHTML={{ __html: theme.scene }} />
      )}
      <AmbientLayer habitat={habitat} />
      {diorama && (
        <DioramaLayer
          habitat={habitat}
          state={state}
          nowMs={nowMs}
          longRunHours={longRunHours}
          creatureSize={40}
          propScale={0.5}
          density={density}
          maxResidents={4}
        />
      )}
      <DayNight hour={hour} />
      <PerchOverlay habitat={habitat} />
    </div>
  )
}

import type { TrackerStatus } from './types'

/** The 8 mood layers every pet sprite ships with. */
export type PetMood =
  | 'idle'
  | 'focused'
  | 'happy'
  | 'celebrate'
  | 'sleep'
  | 'confused'
  | 'tired'
  | 'love'

/** Moods during which the pet stands still rather than walking. */
export const STATIONARY_MOODS: PetMood[] = ['sleep', 'tired', 'confused']

/**
 * Map tracker state to a pet mood (pure, UI-free so it can be unit-tested).
 * Transient reactions (happy/love/celebrate) are layered on top by the UI.
 */
export function moodForState(
  status: TrackerStatus,
  elapsedMs: number,
  longRunMs: number,
  focusMs: number
): PetMood {
  switch (status) {
    case 'locked':
    case 'idle':
    case 'checked_out':
      return 'sleep'
    case 'no_match':
    case 'permission_needed':
      return 'confused'
    case 'tracking':
      if (elapsedMs >= longRunMs) return 'tired'
      if (elapsedMs >= focusMs) return 'focused'
      return 'idle'
    default:
      return 'idle'
  }
}

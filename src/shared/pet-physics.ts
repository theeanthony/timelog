/**
 * Tiny 2-D physics helpers for the pet companions. Kept pure + DOM-free so the
 * fling/gravity behaviour can be unit-tested; the rAF loop in PetLayer owns the
 * orchestration (perch targeting, walking, drag) and calls into these.
 *
 * Units: position in px, velocity in px/s, time (dt) in seconds.
 */

export interface Body {
  x: number
  y: number
  vx: number
  vy: number
}

/** Downward acceleration applied to flung pets. */
export const GRAVITY = 2000
/** Fraction of speed kept after bouncing off the floor/walls. */
export const RESTITUTION = 0.45
/** Horizontal damping applied each time a body is in contact with the floor. */
export const FLOOR_FRICTION = 0.7
/** Below this speed (px/s) a floor-bound body is considered settled. */
export const REST_SPEED = 14

/** Integrate gravity + velocity over `dt` seconds. Mutates and returns `b`. */
export function integrate(b: Body, dt: number, gravity = GRAVITY): Body {
  b.vy += gravity * dt
  b.x += b.vx * dt
  b.y += b.vy * dt
  return b
}

/**
 * Keep `b` inside the box [0,maxX] × [0,floorY], bouncing off the floor and the
 * two side walls. Returns true if the body is touching the floor this step.
 */
export function collide(b: Body, maxX: number, floorY: number, restitution = RESTITUTION): boolean {
  if (b.x < 0) {
    b.x = 0
    b.vx = Math.abs(b.vx) * restitution
  } else if (b.x > maxX) {
    b.x = maxX
    b.vx = -Math.abs(b.vx) * restitution
  }

  if (b.y >= floorY) {
    b.y = floorY
    if (b.vy > 0) b.vy = -b.vy * restitution
    b.vx *= FLOOR_FRICTION
    return true
  }
  if (b.y < 0) {
    b.y = 0
    if (b.vy < 0) b.vy = 0
  }
  return false
}

/** Has a floor-bound body effectively stopped moving? */
export function isResting(b: Body, floorY: number): boolean {
  return b.y >= floorY - 0.5 && Math.abs(b.vy) < REST_SPEED && Math.abs(b.vx) < REST_SPEED
}

/**
 * Step a scalar toward `target` by at most `maxStep`. `arrived` is true once it
 * lands on (or within one step of) the target.
 */
export function approach(
  x: number,
  target: number,
  maxStep: number
): { x: number; arrived: boolean } {
  const d = target - x
  if (Math.abs(d) <= maxStep) return { x: target, arrived: true }
  return { x: x + Math.sign(d) * maxStep, arrived: false }
}

/**
 * Position along a parametric hop arc at progress `u` (0→1) between
 * (sx,sy) and (lx,ly), peaking `arc` px above the straight-line path.
 */
export function hopArc(
  sx: number,
  sy: number,
  lx: number,
  ly: number,
  arc: number,
  u: number
): { x: number; y: number } {
  const t = u < 0 ? 0 : u > 1 ? 1 : u
  return {
    x: sx + (lx - sx) * t,
    y: sy + (ly - sy) * t - arc * Math.sin(Math.PI * t)
  }
}

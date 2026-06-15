import { describe, expect, it } from 'vitest'
import {
  integrate,
  collide,
  isResting,
  approach,
  hopArc,
  GRAVITY,
  type Body
} from '../src/shared/pet-physics'

describe('pet physics', () => {
  it('integrate applies gravity and velocity over dt', () => {
    const b: Body = { x: 0, y: 0, vx: 100, vy: 0 }
    integrate(b, 0.1)
    expect(b.x).toBeCloseTo(10) // 100 px/s * 0.1s
    expect(b.vy).toBeCloseTo(GRAVITY * 0.1)
    expect(b.y).toBeGreaterThan(0) // pulled downward
  })

  it('collide bounces off the floor with reduced speed and reports contact', () => {
    const b: Body = { x: 50, y: 120, vx: 0, vy: 400 }
    const onFloor = collide(b, 200, 100)
    expect(onFloor).toBe(true)
    expect(b.y).toBe(100) // snapped to floor
    expect(b.vy).toBeLessThan(0) // bounced upward
    expect(Math.abs(b.vy)).toBeLessThan(400) // restitution < 1
  })

  it('collide keeps a body inside the side walls', () => {
    const left: Body = { x: -5, y: 0, vx: -200, vy: 0 }
    collide(left, 200, 100)
    expect(left.x).toBe(0)
    expect(left.vx).toBeGreaterThanOrEqual(0) // reflected inward

    const right: Body = { x: 250, y: 0, vx: 200, vy: 0 }
    collide(right, 200, 100)
    expect(right.x).toBe(200)
    expect(right.vx).toBeLessThanOrEqual(0)
  })

  it('isResting is true only once a floor body has slowed down', () => {
    expect(isResting({ x: 0, y: 100, vx: 2, vy: 1 }, 100)).toBe(true)
    expect(isResting({ x: 0, y: 100, vx: 200, vy: 0 }, 100)).toBe(false)
    expect(isResting({ x: 0, y: 40, vx: 0, vy: 0 }, 100)).toBe(false) // still airborne
  })

  it('approach steps toward a target and reports arrival', () => {
    expect(approach(0, 100, 10)).toEqual({ x: 10, arrived: false })
    expect(approach(95, 100, 10)).toEqual({ x: 100, arrived: true })
    expect(approach(100, 100, 10)).toEqual({ x: 100, arrived: true })
  })

  it('hopArc starts low, peaks above the path midway, and lands on target', () => {
    const start = hopArc(0, 100, 200, 100, 40, 0)
    const mid = hopArc(0, 100, 200, 100, 40, 0.5)
    const end = hopArc(0, 100, 200, 100, 40, 1)
    expect(start).toEqual({ x: 0, y: 100 })
    expect(end.x).toBeCloseTo(200)
    expect(end.y).toBeCloseTo(100)
    expect(mid.x).toBeCloseTo(100)
    expect(mid.y).toBeCloseTo(60) // 100 - arc peak
  })
})

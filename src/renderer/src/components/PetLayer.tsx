import { useEffect, useMemo, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { CustomPet, Locomotion, SpriteVariant, TrackerState } from '../../../shared/types'
import { moodForState, STATIONARY_MOODS, type PetMood } from '../../../shared/pet-mood'
import { resolvePet } from '../pets/registry'
import { speciesAct } from '../../../shared/species-traits'
import {
  integrate,
  collide,
  isResting,
  approach,
  hopArc,
  driftToward,
  type Body
} from '../../../shared/pet-physics'
import { composeVariantSvg } from '../../../shared/variant'

interface Props {
  pets?: string[]
  customPets?: CustomPet[]
  /** Active companion variants; when non-empty these render instead of `pets`. */
  party?: SpriteVariant[]
  /** Panel mode: tracker state drives mood. Omit for a fixed-mood stage (Zoo). */
  state?: TrackerState
  nowMs?: number
  longRunHours?: number
  /** Bumped by the app on a celebratory event (e.g. successful export). */
  celebrate?: number
  /** Fixed mood override (used by the Zoo dioramas, which have no tracker state). */
  mood?: PetMood
}

const PET = 24 // sprite box size, px
const FOCUS_MS = 25 * 60_000
const WALK_SPEED = 30 // px/s (scaled per-pet so duplicates don't move in lockstep)
const SWIM_SPEED = 22 // px/s cruise for swimmers
const FLY_SPEED = 30 // px/s cruise for fliers
const JUMP_TO_PERCH_CHANCE = 0.62 // walkers favour hopping onto a prop when one's in reach
const FORAGE_CHANCE = 0.3 // chance a grounded walker pauses to forage instead of strolling
const FLY_PERCH_CHANCE = 0.45 // chance a flier lands on a perch instead of drifting on
const DRAG_THRESHOLD = 4 // px of movement before a press counts as a drag
const FLING_SCALE = 1000 // px/s per (px/ms) of pointer velocity

const BUBBLE: Partial<Record<PetMood, string>> = {
  happy: 'nice work!',
  love: '♥',
  celebrate: '🎉'
}

/**
 * Things a pet can hop up and sit on: the clock-zone UI, plus the `[data-perch]`
 * zones the active habitat backdrop paints over its scene props (branches,
 * rooftops, lily pads, clouds…). Both are found by querying the stage's parent.
 */
const PERCH_SELECTORS = [
  '.clock-timer',
  '.clock-project',
  '.code-badge',
  '.manual-indicator',
  '[data-perch]'
]

type Mode = 'walk' | 'jump' | 'fall' | 'perch' | 'drag' | 'float'

interface Runtime {
  body: Body
  facing: number
  mode: Mode
  /** Intrinsic locomotion (walk floor / swim / fly) for this slot. */
  loco: Locomotion
  speed: number
  targetX: number
  // float (swim/fly) wander target
  ftx: number
  fty: number
  /** Per-pet phase offset so bob/flutter cycles don't sync up. */
  phase: number
  /** While `now < forageUntil` a grounded walker stays put and nibbles. */
  forageUntil: number
  // hop arc
  jSx: number
  jSy: number
  jLx: number
  jLy: number
  jArc: number
  jDur: number
  jT: number
  jLand: Mode
  perchEl: Element | null
  nextAt: number
  // transient reaction
  transient: PetMood | null
  transExp: number
  clicks: number
  clickAt: number
  // drag
  pointerId: number
  offX: number
  offY: number
  moved: boolean
  px: number
  py: number
  pt: number
  flVx: number
  flVy: number
  moving: boolean
}

interface Perch {
  el: Element
  x: number
  y: number
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v)
const now = (): number => (typeof performance !== 'undefined' ? performance.now() : 0)
const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo)

/**
 * A few pet companions that live in the clock zone: they wander the floor, hop
 * up to perch on the timer/labels, and can be grabbed and flung (gravity +
 * bounce). Position is driven imperatively in a rAF loop so there are no React
 * re-renders per frame; React only owns the static sprite markup.
 */
export function PetLayer({
  pets = [],
  customPets = [],
  party,
  state,
  nowMs = 0,
  longRunHours = 4,
  celebrate = 0,
  mood
}: Props): React.JSX.Element {
  const stageRef = useRef<HTMLDivElement>(null)
  const petEls = useRef<(HTMLDivElement | null)[]>([])
  const bubbleEls = useRef<(HTMLSpanElement | null)[]>([])
  const runtimes = useRef<Runtime[]>([])
  const reduceRef = useRef(false)
  const celebRef = useRef(celebrate)

  // Latest base mood + celebrate signal, read by the loop without re-subscribing.
  // With tracker state we map status→mood; otherwise (Zoo stage) use the fixed prop.
  const elapsed = state?.openSessionStartTs ? Math.max(0, nowMs - state.openSessionStartTs) : 0
  const baseMood = state
    ? moodForState(state.status, elapsed, longRunHours * 3_600_000, FOCUS_MS)
    : (mood ?? 'idle')
  const propsRef = useRef({ baseMood, celebrate })
  // Keep the loop's view of mood/celebrate current without re-subscribing it.
  useEffect(() => {
    propsRef.current = { baseMood, celebrate }
  })

  // Each party slot resolves to rendered ingredients. When `party` (collectible
  // variants) is set it takes precedence; otherwise the legacy `pets` species.
  const slots = useMemo(() => {
    const source =
      party && party.length > 0
        ? party.map((v) => {
            const b = resolvePet(v.species, customPets)
            return b
              ? {
                  id: v.species,
                  svg: composeVariantSvg(b.svg, v),
                  color: v.palette.body,
                  accent: v.palette.accent,
                  eye: v.palette.eye,
                  shiny: !!v.shiny,
                  name: b.name,
                  locomotion: b.locomotion
                }
              : null
          })
        : pets.map((id) => {
            const d = resolvePet(id, customPets)
            return d
              ? {
                  id: d.id,
                  svg: d.svg,
                  color: d.body,
                  accent: d.accent,
                  eye: d.eye,
                  shiny: false,
                  name: d.name,
                  locomotion: d.locomotion
                }
              : null
          })
    return source.filter((s): s is NonNullable<typeof s> => s !== null)
  }, [party, pets, customPets])

  // (Re)build the per-pet runtime whenever the party changes.
  useEffect(() => {
    const n = slots.length
    const sr = stageRef.current?.getBoundingClientRect()
    const W = sr?.width ?? 280
    const H = sr?.height ?? 120
    const maxX = Math.max(0, W - PET)
    const floorY = Math.max(0, H - PET)
    const t = now()
    runtimes.current = slots.map((slot, i) => {
      const x = ((i + 1) / (n + 1)) * maxX
      const loco = slot.locomotion
      const floats = loco !== 'walk'
      // Fliers cruise the upper band; swimmers use the whole tank; walkers the floor.
      const ceil = loco === 'fly' ? floorY * 0.6 : floorY
      const y = floats ? rand(0, ceil) : floorY
      const ftx = rand(0, maxX)
      const fty = rand(0, ceil)
      return {
        body: { x, y, vx: 0, vy: 0 },
        facing: i % 2 ? -1 : 1,
        mode: floats ? 'float' : 'walk',
        loco,
        speed: 0.75 + ((i * 0.41) % 1) * 0.6,
        targetX: x,
        ftx,
        fty,
        phase: (i * 1.7) % (Math.PI * 2),
        forageUntil: 0,
        jSx: 0,
        jSy: 0,
        jLx: 0,
        jLy: 0,
        jArc: 0,
        jDur: 0.6,
        jT: 0,
        jLand: 'walk',
        perchEl: null,
        nextAt: t + 800 + i * 500,
        transient: null,
        transExp: 0,
        clicks: 0,
        clickAt: 0,
        pointerId: -1,
        offX: 0,
        offY: 0,
        moved: false,
        px: 0,
        py: 0,
        pt: 0,
        flVx: 0,
        flVy: 0,
        moving: false
      }
    })
    petEls.current.length = n
    bubbleEls.current.length = n
    runtimes.current.forEach((rt, i) => {
      const el = petEls.current[i]
      if (el) {
        el.dataset.mood = propsRef.current.baseMood
        el.style.transform = `translate(${rt.body.x}px, ${rt.body.y}px) scaleX(${rt.facing})`
      }
    })
  }, [slots])

  // Honour reduced-motion: pets stop wandering but can still be dragged.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceRef.current = mq.matches
    const on = (): void => {
      reduceRef.current = mq.matches
    }
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  // The animation loop. Reads refs only, so it never needs to restart.
  useEffect(() => {
    let raf = 0
    let last = now()

    const collectPerches = (sr: DOMRect, maxX: number, floorY: number): Perch[] => {
      const root = stageRef.current?.parentElement
      if (!root) return []
      const out: Perch[] = []
      for (const sel of PERCH_SELECTORS) {
        root.querySelectorAll(sel).forEach((el) => {
          const r = el.getBoundingClientRect()
          if (r.width < 12 || r.height < 8) return
          const x = clamp(r.left - sr.left + r.width / 2 - PET / 2, 0, maxX)
          const y = clamp(r.top - sr.top - PET + 6, 0, floorY)
          if (y < floorY - 6) out.push({ el, x, y }) // only things raised off the floor
        })
      }
      return out
    }

    const startHop = (
      rt: Runtime,
      lx: number,
      ly: number,
      land: Mode,
      el: Element | null
    ): void => {
      rt.mode = 'jump'
      rt.jSx = rt.body.x
      rt.jSy = rt.body.y
      rt.jLx = lx
      rt.jLy = ly
      const dist = Math.hypot(lx - rt.body.x, ly - rt.body.y)
      rt.jArc = Math.max(22, dist * 0.3)
      rt.jDur = clamp(0.45 + dist / 700, 0.45, 1.1)
      rt.jT = 0
      rt.jLand = land
      rt.perchEl = land === 'perch' ? el : null
    }

    const fly = (rt: Runtime): boolean => rt.loco === 'fly'
    const floats = (rt: Runtime): boolean => rt.loco !== 'walk'
    // A fresh drift target: fliers favour the upper band, swimmers the whole tank.
    const pickDrift = (rt: Runtime, t: number, maxX: number, floorY: number): void => {
      rt.ftx = rand(0, maxX)
      rt.fty = rand(0, fly(rt) ? floorY * 0.6 : floorY)
      rt.nextAt = t + rand(2200, 5200)
    }

    const decide = (rt: Runtime, t: number, maxX: number, floorY: number, sr: DOMRect): void => {
      // Leaving a perch: drop back into the home locomotion.
      if (rt.mode === 'perch') {
        if (floats(rt))
          startHop(rt, rand(0, maxX), rand(0, fly(rt) ? floorY * 0.6 : floorY), 'float', null)
        else startHop(rt, rand(0, maxX), floorY, 'walk', null)
        return
      }
      // Swimmers & fliers drift between points; fliers occasionally land on a perch.
      if (floats(rt)) {
        const perches = fly(rt) ? collectPerches(sr, maxX, floorY) : []
        if (perches.length && Math.random() < FLY_PERCH_CHANCE) {
          const p = perches[Math.floor(Math.random() * perches.length)]
          startHop(rt, p.x, p.y, 'perch', p.el)
        } else {
          pickDrift(rt, t, maxX, floorY)
        }
        return
      }
      // Grounded walkers: hop to a perch, pause to forage, or stroll to a new spot.
      const perches = collectPerches(sr, maxX, floorY)
      if (perches.length && Math.random() < JUMP_TO_PERCH_CHANCE) {
        const p = perches[Math.floor(Math.random() * perches.length)]
        startHop(rt, p.x, p.y, 'perch', p.el)
      } else if (Math.random() < FORAGE_CHANCE) {
        rt.forageUntil = t + rand(1600, 3200)
        rt.targetX = rt.body.x
        rt.nextAt = rt.forageUntil + rand(400, 1200)
      } else {
        rt.targetX = rand(0, maxX)
        rt.nextAt = t + rand(2500, 6000)
      }
    }

    const frame = (ts: number): void => {
      const dt = clamp((ts - last) / 1000, 0, 0.05)
      last = ts
      const stage = stageRef.current
      if (!stage) {
        raf = requestAnimationFrame(frame)
        return
      }
      const sr = stage.getBoundingClientRect()
      const maxX = Math.max(0, sr.width - PET)
      const floorY = Math.max(0, sr.height - PET)
      const reduce = reduceRef.current
      const { baseMood: base, celebrate: celeb } = propsRef.current

      // A celebrate signal makes the whole party react.
      if (celeb !== celebRef.current) {
        celebRef.current = celeb
        if (celeb > 0) {
          for (const rt of runtimes.current) {
            rt.transient = 'celebrate'
            rt.transExp = ts + 2500
          }
        }
      }

      for (let i = 0; i < runtimes.current.length; i++) {
        const rt = runtimes.current[i]
        const el = petEls.current[i]
        if (!rt || !el) continue

        if (rt.transient && ts > rt.transExp) rt.transient = null
        const mood = rt.transient ?? base
        const stationary = STATIONARY_MOODS.includes(mood)

        switch (rt.mode) {
          case 'drag':
            rt.moving = true
            break
          case 'fall': {
            integrate(rt.body, dt)
            const onFloor = collide(rt.body, maxX, floorY)
            rt.facing = rt.body.vx >= 0 ? 1 : -1
            rt.moving = true
            if (onFloor && isResting(rt.body, floorY)) {
              rt.body.vx = 0
              rt.body.vy = 0
              rt.mode = 'walk'
              rt.targetX = rt.body.x
              rt.nextAt = ts + rand(1200, 2600)
              rt.moving = false
            }
            break
          }
          case 'jump': {
            rt.jT += dt
            const u = rt.jDur > 0 ? rt.jT / rt.jDur : 1
            const p = hopArc(rt.jSx, rt.jSy, rt.jLx, rt.jLy, rt.jArc, u)
            rt.body.x = p.x
            rt.body.y = p.y
            rt.facing = rt.jLx >= rt.jSx ? 1 : -1
            rt.moving = true
            if (u >= 1) {
              rt.body.x = rt.jLx
              rt.body.y = rt.jLy
              rt.body.vx = 0
              rt.body.vy = 0
              rt.mode = rt.jLand
              rt.ftx = rt.body.x // hover here until the next drift target is chosen
              rt.fty = rt.body.y
              rt.moving = false
              rt.nextAt = ts + rand(2500, 6000)
            }
            break
          }
          case 'perch': {
            if (rt.perchEl && document.contains(rt.perchEl)) {
              const pr = rt.perchEl.getBoundingClientRect()
              rt.body.x = clamp(pr.left - sr.left + pr.width / 2 - PET / 2, 0, maxX)
              rt.body.y = clamp(pr.top - sr.top - PET + 6, 0, floorY)
              rt.moving = false
              if (!reduce && !stationary && ts >= rt.nextAt) decide(rt, ts, maxX, floorY, sr)
            } else {
              rt.perchEl = null
              // perch vanished — walkers drop, swimmers/fliers resume drifting
              rt.mode = rt.loco === 'walk' ? 'fall' : 'float'
              rt.ftx = rt.body.x
              rt.fty = rt.body.y
            }
            break
          }
          case 'float': {
            if (reduce || stationary) {
              rt.moving = false
              break
            }
            if (ts >= rt.nextAt) decide(rt, ts, maxX, floorY, sr)
            if (rt.mode === 'float') {
              const cruise = (rt.loco === 'fly' ? FLY_SPEED : SWIM_SPEED) * rt.speed
              const r = driftToward(rt.body, rt.ftx, rt.fty, dt, cruise)
              if (rt.body.x < 0) {
                rt.body.x = 0
                rt.body.vx = 0
              } else if (rt.body.x > maxX) {
                rt.body.x = maxX
                rt.body.vx = 0
              }
              if (rt.body.y < 0) {
                rt.body.y = 0
                rt.body.vy = 0
              } else if (rt.body.y > floorY) {
                rt.body.y = floorY
                rt.body.vy = 0
              }
              if (Math.abs(rt.body.vx) > 1) rt.facing = rt.body.vx >= 0 ? 1 : -1
              rt.moving = true
              if (r.arrived) decide(rt, ts, maxX, floorY, sr)
            }
            break
          }
          case 'walk':
          default: {
            rt.body.y = floorY
            if (reduce || stationary) {
              rt.moving = false
              break
            }
            // foraging: stand put and nibble (the dip is drawn in the bob below)
            if (ts < rt.forageUntil) {
              rt.moving = false
              break
            }
            const dir = Math.sign(rt.targetX - rt.body.x)
            if (dir !== 0) rt.facing = dir
            const r = approach(rt.body.x, rt.targetX, WALK_SPEED * rt.speed * dt)
            rt.body.x = r.x
            rt.moving = !r.arrived
            if (ts >= rt.nextAt) decide(rt, ts, maxX, floorY, sr)
            break
          }
        }

        // Ambient vertical motion drawn on top of physics: a swim/flutter bob, or
        // a quick downward peck while foraging. Purely visual (doesn't touch the body).
        let bob = 0
        if (!reduce && !stationary) {
          if (rt.mode === 'float') {
            bob =
              Math.sin(ts * (rt.loco === 'fly' ? 0.006 : 0.003) + rt.phase) *
              (rt.loco === 'fly' ? 3.2 : 2.2)
          } else if (rt.mode === 'walk' && ts < rt.forageUntil) {
            bob = Math.abs(Math.sin(ts * 0.012 + rt.phase)) * 3
          }
        }
        el.style.transform = `translate(${rt.body.x}px, ${rt.body.y + bob}px) scaleX(${rt.facing})`
        const mv = rt.moving ? '1' : '0'
        if (el.dataset.moving !== mv) el.dataset.moving = mv
        if (el.dataset.mood !== mood) el.dataset.mood = mood

        const bub = bubbleEls.current[i]
        if (bub) {
          const text = BUBBLE[mood]
          if (text) {
            if (bub.textContent !== text) bub.textContent = text
            bub.style.display = 'block'
          } else if (bub.style.display !== 'none') {
            bub.style.display = 'none'
          }
        }
      }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  const hop = (i: number): void => {
    if (reduceRef.current) return
    petEls.current[i]
      ?.querySelector('.pet-svg')
      ?.animate(
        [
          { transform: 'translateY(0)' },
          { transform: 'translateY(-9px)' },
          { transform: 'translateY(0)' }
        ],
        { duration: 480, easing: 'ease-out' }
      )
  }

  const react = (i: number): void => {
    const rt = runtimes.current[i]
    if (!rt) return
    const t = now()
    rt.clicks = t - rt.clickAt < 900 ? rt.clicks + 1 : 1
    rt.clickAt = t
    rt.transient = rt.clicks >= 3 ? 'love' : 'happy'
    rt.transExp = t + 1500
    // Signature one-shot move for this species (pounce/soar/hop/…) on tap.
    const el = petEls.current[i]
    const slot = slots[i]
    if (el && slot && !reduceRef.current) {
      el.dataset.act = speciesAct(slot.id)
      window.setTimeout(() => el.removeAttribute('data-act'), 800)
    }
    hop(i)
  }

  const onPointerDown =
    (i: number) =>
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const rt = runtimes.current[i]
      const el = petEls.current[i]
      const stage = stageRef.current
      if (!rt || !el || !stage) return
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      const sr = stage.getBoundingClientRect()
      rt.pointerId = e.pointerId
      rt.mode = 'drag'
      rt.moved = false
      rt.perchEl = null
      rt.offX = e.clientX - sr.left - rt.body.x
      rt.offY = e.clientY - sr.top - rt.body.y
      rt.px = e.clientX
      rt.py = e.clientY
      rt.pt = now()
      rt.flVx = 0
      rt.flVy = 0
      el.classList.add('pet--drag')
    }

  const onPointerMove =
    (i: number) =>
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const rt = runtimes.current[i]
      const stage = stageRef.current
      if (!rt || !stage || rt.mode !== 'drag' || e.pointerId !== rt.pointerId) return
      const sr = stage.getBoundingClientRect()
      const maxX = Math.max(0, sr.width - PET)
      const floorY = Math.max(0, sr.height - PET)
      if (Math.abs(e.clientX - rt.px) + Math.abs(e.clientY - rt.py) > DRAG_THRESHOLD)
        rt.moved = true
      const t = now()
      const dt = Math.max(1, t - rt.pt)
      rt.flVx = (e.clientX - rt.px) / dt
      rt.flVy = (e.clientY - rt.py) / dt
      rt.px = e.clientX
      rt.py = e.clientY
      rt.pt = t
      rt.body.x = clamp(e.clientX - sr.left - rt.offX, 0, maxX)
      rt.body.y = clamp(e.clientY - sr.top - rt.offY, 0, floorY)
    }

  const onPointerUp =
    (i: number) =>
    (e: React.PointerEvent<HTMLDivElement>): void => {
      const rt = runtimes.current[i]
      const el = petEls.current[i]
      if (!rt || rt.mode !== 'drag') return
      try {
        el?.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      el?.classList.remove('pet--drag')
      rt.pointerId = -1
      const floats = rt.loco !== 'walk'
      if (!rt.moved) {
        react(i) // a tap, not a throw
        rt.mode = floats ? 'float' : 'walk'
        rt.body.vx = 0
        rt.body.vy = 0
        rt.targetX = rt.body.x
        rt.ftx = rt.body.x
        rt.fty = rt.body.y
        rt.nextAt = now() + (floats ? rand(400, 900) : 800)
        return
      }
      if (reduceRef.current) {
        rt.mode = floats ? 'float' : 'walk'
        rt.body.vx = 0
        rt.body.vy = 0
        rt.targetX = rt.body.x
        rt.ftx = rt.body.x
        rt.fty = rt.body.y
        rt.nextAt = now() + 600
        return
      }
      // A flung pet gives a quick startle.
      rt.transient = 'surprised'
      rt.transExp = now() + 900
      // Swimmers/fliers keep the fling momentum then driftToward curves them back
      // to a cruise; walkers fall under gravity and bounce.
      if (floats) {
        rt.body.vx = clamp(rt.flVx * FLING_SCALE, -1400, 1400)
        rt.body.vy = clamp(rt.flVy * FLING_SCALE, -1400, 1400)
        rt.mode = 'float'
        rt.ftx = rt.body.x
        rt.fty = rt.body.y
        rt.nextAt = now() + rand(450, 1000) // re-target shortly so momentum eases off
        return
      }
      rt.body.vx = clamp(rt.flVx * FLING_SCALE, -1400, 1400)
      rt.body.vy = clamp(rt.flVy * FLING_SCALE, -1600, 1600)
      rt.mode = 'fall'
    }

  return (
    <div className="pet-layer" aria-hidden ref={stageRef}>
      {slots.map((slot, i) => (
        <div
          key={i}
          className={`pet${slot.shiny ? ' pet--shiny' : ''}`}
          data-loco={slot.locomotion}
          ref={(el) => {
            petEls.current[i] = el
          }}
          style={
            {
              color: slot.color,
              '--pet-accent': slot.accent,
              '--pet-eye': slot.eye
            } as CSSProperties
          }
          role="button"
          tabIndex={0}
          aria-label={`${slot.name} companion`}
          title={slot.name}
          onPointerDown={onPointerDown(i)}
          onPointerMove={onPointerMove(i)}
          onPointerUp={onPointerUp(i)}
          onPointerCancel={onPointerUp(i)}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault()
              react(i)
            }
          }}
        >
          <span
            className="pet-bubble"
            ref={(el) => {
              bubbleEls.current[i] = el
            }}
            style={{ display: 'none' }}
          />
          <span className="pet-svg" dangerouslySetInnerHTML={{ __html: slot.svg }} />
        </div>
      ))}
    </div>
  )
}

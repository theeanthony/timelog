import { useEffect, useRef } from 'react'
import type { Habitat, Locomotion, TrackerState } from '../../../shared/types'
import { moodForState, type PetMood } from '../../../shared/pet-mood'
import { resolvePet } from '../pets/registry'
import { habitatResidents } from '../../../shared/habitat-residents'
import { speciesAct } from '../../../shared/species-traits'
import {
  habitatActivities,
  spotEligible,
  anchorTarget,
  type ActivitySpot
} from '../../../shared/habitat-activities'
import { habitatEvent, type EnvEvent } from '../../../shared/habitat-events'

interface Props {
  habitat: Habitat
  /** Panel mode: tracker state drives the residents' mood. Omit for a fixed mood. */
  state?: TrackerState
  nowMs?: number
  longRunHours?: number
  /** Fixed mood override (Zoo dioramas, which have no tracker state). */
  mood?: PetMood
  /** Sprite box size in px (72 for the Zoo stage, ~44 behind the panel). */
  creatureSize?: number
  /** Scales the environment props down to fit smaller stages. */
  propScale?: number
  /** Multiplies the resident count (and is capped by `maxResidents`). */
  density?: number
  /** Cap on roaming residents. */
  maxResidents?: number
  /** Freeze the scene (e.g. while the panel is minimised). */
  paused?: boolean
  /** Enable tap-to-summon + tap-the-scene reactions (Zoo). Off → ambient backdrop. */
  interactive?: boolean
}

const FOCUS_MS = 25 * 60_000

type CreatureState = 'roam' | 'seek' | 'perform'

interface Creature {
  id: string
  el: HTMLDivElement
  svg: SVGElement
  loco: Locomotion
  act: string
  x: number
  y: number
  dir: number
  moving: boolean
  mv: number
  state: CreatureState
  activity: Spot | null
  perfT: number
  actT: number
  acting: number
  tx: number
  ty: number
  wait: number
  retarget: number
  perch: boolean
}

interface Spot {
  def: ActivitySpot
  el: HTMLDivElement
  busy: Creature | null
  px: number
  py: number
}

const rnd = (a: number, b: number): number => a + Math.random() * (b - a)

/**
 * A living-habitat diorama: the biome's resident critters roam/swim/fly per
 * their locomotion, seek out the scene's interactive props (climb a tree, surf
 * a wave, dig a mound, nap in a nest…), react to taps, and the biome fires its
 * own periodic event (aurora, eruption, falling leaves…). One rAF loop drives
 * everything imperatively — no React re-render per frame; React owns only the
 * container markup. Mirrors the standalone diorama engine the sprite pack ships.
 */
export function DioramaLayer({
  habitat,
  state,
  nowMs = 0,
  longRunHours = 4,
  mood,
  creatureSize = 72,
  propScale = 1,
  density = 1,
  maxResidents = 6,
  paused = false,
  interactive = false
}: Props): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const propsRef = useRef<HTMLDivElement>(null)
  const eventsRef = useRef<HTMLDivElement>(null)

  // Latest mood + paused, read by the loop without re-subscribing it.
  const elapsed = state?.openSessionStartTs ? Math.max(0, nowMs - state.openSessionStartTs) : 0
  const liveMood: PetMood = state
    ? moodForState(state.status, elapsed, longRunHours * 3_600_000, FOCUS_MS)
    : (mood ?? 'idle')
  const cfgRef = useRef({ mood: liveMood, paused })
  useEffect(() => {
    cfgRef.current = { mood: liveMood, paused }
    rootRef.current?.classList.toggle('paused', paused)
  })

  // Build the scene + run the engine. Rebuilds when the habitat or sizing changes.
  useEffect(() => {
    const root = rootRef.current
    const field = fieldRef.current
    const propsHost = propsRef.current
    const eventsHost = eventsRef.current
    if (!root || !field || !propsHost || !eventsHost) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const S = creatureSize
    let W = 0
    let H = 0
    const creatures: Creature[] = []
    const spots: Spot[] = []
    let raf = 0
    let evtTimer = 0
    let dispTimer = 0
    let last = performance.now()
    const ephemeral = new Set<HTMLElement>()

    const measure = (): void => {
      const r = field.getBoundingClientRect()
      W = r.width
      H = r.height
    }

    const band = (loco: Locomotion): [number, number] => {
      if (loco === 'fly') return [H * 0.04, H * 0.46]
      if (loco === 'swim') return [H * 0.34, Math.max(H * 0.34, H - S - H * 0.06)]
      return [H - S - rnd(2, 10), H - S + 2]
    }

    const place = (c: Creature): void => {
      c.el.style.transform = `translate(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px) scaleX(${c.dir})`
    }

    const setMoving = (c: Creature): void => {
      const v = c.moving ? 1 : 0
      if (c.mv === v) return
      c.mv = v
      c.svg.setAttribute('data-moving', String(v))
    }

    const newTarget = (c: Creature): void => {
      const b = band(c.loco)
      c.tx = rnd(W * 0.04, W - S - W * 0.04)
      c.ty = rnd(b[0], b[1])
      c.perch = c.loco === 'fly' && Math.random() < 0.34
      if (c.perch) c.ty = H * rnd(0.5, 0.6)
      c.wait = rnd(0.2, 1.4)
      c.retarget = rnd(2.4, 6.2)
    }

    const moodSpeed = (): number => {
      const m = cfgRef.current.mood
      if (m === 'sleep') return 0
      if (m === 'tired') return 0.4
      if (m === 'celebrate') return 1.7
      if (m === 'happy' || m === 'playful') return 1.35
      if (m === 'focused') return 0.7
      return 1
    }

    const applyMood = (): void => {
      const m = cfgRef.current.mood
      for (const c of creatures) if (c.state !== 'perform') c.svg.setAttribute('data-mood', m)
    }

    const doAct = (c: Creature): void => {
      c.svg.setAttribute('data-act', c.act)
      c.acting = 0.9
      c.actT = rnd(4, 10)
    }

    // --- ephemeral FX helpers (ripples, embers, leaves, biome events) ---
    const spawn = (cls: string, life: number, vars?: Record<string, string>): HTMLElement => {
      const d = document.createElement('div')
      d.className = cls
      if (vars) for (const k in vars) d.style.setProperty(k, vars[k])
      eventsHost.appendChild(d)
      ephemeral.add(d)
      window.setTimeout(() => {
        d.remove()
        ephemeral.delete(d)
      }, life)
      return d
    }
    const ripple = (x: number, y: number): void => {
      const d = spawn('fx-ripple', 760)
      d.style.left = `${x}px`
      d.style.top = `${y}px`
    }
    const puff = (x: number, y: number): void => {
      for (let i = 0; i < 4; i++) {
        const d = spawn('evt-puff', 800, { '--px': `${rnd(-26, 26).toFixed(0)}px` })
        d.style.left = `${x}px`
        d.style.top = `${y}px`
      }
    }
    const ember = (x: number, y: number): void => {
      const d = spawn('evt-ember', 1400, { '--ex': `${rnd(-40, 40)}px` })
      d.style.left = `${x}px`
      d.style.top = `${y}px`
    }
    const leaf = (): void => {
      const d = spawn('evt-leaf', 4200, {
        '--lx': `${rnd(-40, 30)}px`,
        '--ld': `${rnd(2.4, 4).toFixed(2)}s`
      })
      d.style.left = `${rnd(10, 90)}%`
    }

    // --- activity props ---
    const repositionSpots = (): void => {
      for (const s of spots) {
        s.px = s.def.fx * W
        s.py = s.def.fy * H
        const e = s.el
        const h = s.def.h * propScale
        e.style.left = `${s.px}px`
        if (s.def.place === 'above') {
          e.style.top = `${s.py - h}px`
          e.style.transform = 'translateX(-50%)'
        } else if (s.def.place === 'base') {
          e.style.top = `${s.py}px`
          e.style.transform = 'translate(-50%,-100%)'
        } else {
          e.style.top = `${s.py}px`
          e.style.transform = 'translate(-50%,-50%)'
        }
      }
    }

    const target = (s: Spot): { x: number; y: number } => {
      const t = anchorTarget(s.def, S, W, H, propScale)
      return {
        x: Math.max(2, Math.min(W - S - 2, t.x)),
        y: Math.max(2, Math.min(H - 4, t.y))
      }
    }

    const dispatch = (s: Spot, c: Creature): boolean => {
      if (!s || !c || s.busy || c.state === 'perform') return false
      if (!spotEligible(s.def, c.loco)) return false
      for (const o of spots) if (o.busy === c) o.busy = null
      s.busy = c
      c.activity = s
      c.state = 'seek'
      const t = target(s)
      c.tx = t.x
      c.ty = t.y
      s.el.classList.add('claimed')
      return true
    }

    const startPerform = (c: Creature): void => {
      const s = c.activity
      if (!s) {
        c.state = 'roam'
        return
      }
      const d = s.def
      c.state = 'perform'
      c.perfT = rnd(4, 6.5)
      c.moving = false
      setMoving(c)
      c.svg.setAttribute('data-act', `p-${d.pa}`)
      c.svg.setAttribute('data-mood', d.mood)
      c.el.classList.add('busy')
      s.el.classList.add('active')
      if (d.pa === 'splash' || d.pa === 'surf') ripple(c.x + S / 2, c.y + S * 0.82)
      if (d.pa === 'dig') puff(c.x + S / 2, c.y + S * 0.85)
      if (d.pa === 'glow' || d.pa === 'bask') c.el.classList.add('aglow')
    }

    const endPerform = (c: Creature): void => {
      const s = c.activity
      c.svg.removeAttribute('data-act')
      c.svg.setAttribute('data-mood', cfgRef.current.mood)
      c.el.classList.remove('busy', 'aglow')
      if (s) {
        s.busy = null
        s.el.classList.remove('claimed', 'active')
      }
      c.activity = null
      c.state = 'roam'
      c.wait = rnd(0.6, 2)
      c.retarget = rnd(2, 4)
      newTarget(c)
    }

    const summonTo = (s: Spot): void => {
      if (!s || s.busy || cfgRef.current.paused) return
      const cand = creatures
        .filter((c) => (c.state === 'roam' || c.state === 'seek') && spotEligible(s.def, c.loco))
        .sort((a, b) => Math.hypot(a.x - s.px, a.y - s.py) - Math.hypot(b.x - s.px, b.y - s.py))
      if (!cand.length) return
      const c = cand[0]
      if (c.state === 'seek') {
        for (const o of spots) if (o.busy === c) o.busy = null
        c.state = 'roam'
      }
      if (dispatch(s, c)) {
        s.el.classList.add('ping')
        window.setTimeout(() => s.el.classList.remove('ping'), 500)
      }
    }

    const onTap = (e: PointerEvent): void => {
      const r = field.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      ripple(x, y)
      const arr = creatures
        .slice()
        .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
      let did = 0
      for (let i = 0; i < arr.length && did < 3; i++) {
        const c = arr[i]
        if (c.state === 'perform' || c.state === 'seek') continue
        c.tx = Math.max(0, Math.min(W - S, x - S / 2))
        c.ty = c.loco === 'walk' ? c.y : Math.max(band(c.loco)[0], y - S / 2)
        c.wait = 0
        c.retarget = rnd(2.5, 5)
        doAct(c)
        did++
      }
    }

    // --- periodic biome event ---
    const fireEvent = (): void => {
      if (cfgRef.current.paused) return
      const kind: EnvEvent = habitatEvent(habitat)
      switch (kind) {
        case 'shoot':
          spawn('evt-shoot', 1300, { '--sx': `${rnd(8, 60)}%`, '--sy': `${rnd(6, 30)}%` })
          break
        case 'erupt':
          ripple(W * rnd(0.4, 0.6), H * 0.2)
          spawn('evt-erupt', 1500)
          for (let i = 0; i < 9; i++) ember(W * 0.5 + rnd(-30, 30), H * 0.22)
          break
        case 'wave':
          spawn('evt-wave', 3000)
          break
        case 'leaffall':
          for (let j = 0; j < 5; j++) leaf()
          break
        case 'gust':
          spawn('evt-gust', 2200)
          break
        case 'ripple':
          spawn('evt-ripple2', 1800, { '--rx': `${rnd(20, 80)}%`, '--ry': `${rnd(60, 85)}%` })
          break
        case 'aurora':
          spawn('evt-aurora', 4200)
          break
        case 'cryspulse':
          spawn('evt-cryspulse', 2200)
          break
        case 'flicker':
          spawn('evt-flicker', 900, { '--fx': `${rnd(10, 90)}%`, '--fy': `${rnd(10, 50)}%` })
          break
        case 'heat':
          spawn('evt-heat', 2600)
          break
        case 'lamp':
          spawn('evt-lamp', 1600)
          break
      }
    }
    const scheduleEvent = (): void => {
      evtTimer = window.setTimeout(
        () => {
          fireEvent()
          scheduleEvent()
        },
        rnd(3800, 8200)
      )
    }

    const autoDispatch = (): void => {
      if (cfgRef.current.paused || moodSpeed() === 0) return
      if (Math.random() < 0.25) return
      const free = spots.filter((s) => !s.busy)
      const idle = creatures.filter((c) => c.state === 'roam')
      if (!free.length || !idle.length) return
      for (let t = 0; t < 6; t++) {
        const s = free[(Math.random() * free.length) | 0]
        const c = idle[(Math.random() * idle.length) | 0]
        if (spotEligible(s.def, c.loco)) {
          dispatch(s, c)
          return
        }
      }
    }
    const scheduleDispatch = (): void => {
      dispTimer = window.setTimeout(
        () => {
          autoDispatch()
          scheduleDispatch()
        },
        rnd(2200, 4200)
      )
    }

    const step = (dt: number): void => {
      const spd = moodSpeed()
      const still = spd === 0
      for (const c of creatures) {
        if (c.state === 'perform') {
          c.perfT -= dt
          if (c.perfT <= 0) endPerform(c)
          continue
        }
        if (c.state === 'seek') {
          if (still) {
            c.moving = false
            setMoving(c)
            continue
          }
          const sdx = c.tx - c.x
          const sdy = c.ty - c.y
          const sd = Math.hypot(sdx, sdy)
          if (sd < 5) {
            startPerform(c)
            continue
          }
          const sstep = Math.min(sd, (c.loco === 'fly' ? 60 : 46) * spd * dt)
          c.x += (sdx / sd) * sstep
          c.y += (sdy / sd) * sstep
          if (Math.abs(sdx) > 1.5) c.dir = sdx < 0 ? -1 : 1
          c.moving = true
          setMoving(c)
          place(c)
          continue
        }

        // roaming
        c.actT -= dt
        if (c.actT <= 0 && !still && Math.random() < 0.3) doAct(c)
        else if (c.actT <= 0) c.actT = rnd(3, 8)
        if (c.acting > 0) {
          c.acting -= dt
          if (c.acting <= 0) c.svg.removeAttribute('data-act')
        }

        if (still) {
          c.moving = false
          setMoving(c)
          continue
        }

        c.wait -= dt
        c.retarget -= dt
        if (c.retarget <= 0) newTarget(c)
        if (c.wait > 0) {
          c.moving = false
          setMoving(c)
          continue
        }

        const base = (c.loco === 'fly' ? 46 : c.loco === 'swim' ? 30 : 34) * spd
        const dx = c.tx - c.x
        const dy = c.ty - c.y
        const dist = Math.hypot(dx, dy)
        if (dist < 3) {
          c.moving = false
          setMoving(c)
          c.wait = rnd(0.4, 2.2)
          continue
        }
        const stepLen = Math.min(dist, base * dt)
        c.x += (dx / dist) * stepLen
        c.y += (dy / dist) * stepLen
        if (Math.abs(dx) > 1.5) c.dir = dx < 0 ? -1 : 1
        if (c.loco !== 'walk') c.y += Math.sin(performance.now() / 420 + c.x) * 0.25
        c.moving = !(c.perch && dist < 6)
        setMoving(c)
        place(c)
      }
    }

    const loop = (ts: number): void => {
      const dt = Math.min(0.05, (ts - last) / 1000)
      last = ts
      if (!cfgRef.current.paused && !reduce && W) step(dt)
      raf = requestAnimationFrame(loop)
    }

    // ---- build the scene ----
    const buildCreatures = (): void => {
      const roster = habitatResidents(habitat).slice(
        0,
        Math.max(1, Math.round(maxResidents * density))
      )
      for (let i = 0; i < roster.length; i++) {
        const id = roster[i]
        const def = resolvePet(id)
        if (!def) continue
        const el = document.createElement('div')
        el.className = 'creature'
        el.style.width = `${S}px`
        el.style.height = `${S}px`
        el.style.color = def.body
        el.style.setProperty('--pet-accent', def.accent)
        el.style.setProperty('--pet-eye', def.eye)
        const holder = document.createElement('div')
        holder.innerHTML = def.svg
        const svg = holder.firstElementChild as SVGElement | null
        if (!svg) continue
        svg.setAttribute('class', 'walker')
        svg.setAttribute('data-mood', cfgRef.current.mood)
        svg.setAttribute('data-loco', def.locomotion)
        svg.removeAttribute('width')
        svg.removeAttribute('height')
        el.appendChild(svg)
        field.appendChild(el)
        const b = band(def.locomotion)
        const c: Creature = {
          id,
          el,
          svg,
          loco: def.locomotion,
          act: speciesAct(id),
          x: rnd(W * 0.1, W * 0.85),
          y: rnd(b[0], b[1]),
          dir: i % 2 ? -1 : 1,
          moving: false,
          mv: -1,
          state: 'roam',
          activity: null,
          perfT: 0,
          actT: rnd(3, 9),
          acting: 0,
          tx: 0,
          ty: 0,
          wait: 0,
          retarget: 0,
          perch: false
        }
        newTarget(c)
        creatures.push(c)
        place(c)
      }
    }

    const buildSpots = (): void => {
      for (const d of habitatActivities(habitat)) {
        const m = document.createElement('div')
        m.className = `prop prop-${d.prop} place-${d.place}`
        m.style.width = `${d.w * propScale}px`
        m.style.height = `${d.h * propScale}px`
        m.innerHTML =
          `<span class="prop-halo"></span><span class="prop-art">${d.svg}</span>` +
          `<span class="prop-lbl">${d.label}</span>`
        propsHost.appendChild(m)
        const s: Spot = { def: d, el: m, busy: null, px: 0, py: 0 }
        spots.push(s)
        m.addEventListener('pointerdown', (e) => {
          e.stopPropagation()
          summonTo(s)
        })
      }
      repositionSpots()
    }

    measure()
    buildCreatures()
    buildSpots()
    applyMood()
    if (interactive) field.addEventListener('pointerdown', onTap)

    const ro = new ResizeObserver(() => {
      measure()
      repositionSpots()
    })
    ro.observe(field)

    last = performance.now()
    raf = requestAnimationFrame(loop)
    if (!reduce) {
      scheduleEvent()
      scheduleDispatch()
    }

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(evtTimer)
      window.clearTimeout(dispTimer)
      ro.disconnect()
      if (interactive) field.removeEventListener('pointerdown', onTap)
      ephemeral.forEach((d) => d.remove())
      field.replaceChildren()
      propsHost.replaceChildren()
      eventsHost.replaceChildren()
    }
  }, [habitat, creatureSize, propScale, density, maxResidents, interactive])

  return (
    <div
      className={`diorama-layer${interactive ? ' diorama-layer--interactive' : ''}`}
      aria-hidden
      ref={rootRef}
    >
      <div className="field" ref={fieldRef} />
      <div className="props" ref={propsRef} />
      <div className="events" ref={eventsRef} />
    </div>
  )
}

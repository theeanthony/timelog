/**
 * Interactive environment props per habitat — the real, drawn objects a critter
 * seeks out and performs on (climb a tree, surf a wave, swing a vine, nap in a
 * nest, dig a mound…). Each habitat lays out a few activity spots; the diorama
 * engine renders the prop art, sends an eligible resident to it, and plays the
 * held performance move while the prop animates in concert.
 *
 * Pure + DOM-free (SVG strings only) so it can be unit-tested and shared. The
 * prop class names + `pa`/`anchor`/`place` values map to the CSS in main.css.
 */
import type { Habitat, Locomotion } from './types'
import type { PetMood } from './pet-mood'

/** How a prop is positioned relative to its spot point. */
export type Place = 'center' | 'above' | 'base'

/** Where the performing pet settles relative to the prop. */
export type Anchor = 'on' | 'ontop' | 'onwave' | 'under' | 'beside' | 'hang' | 'swing' | 'climb'

/** Held performance move (maps to a `[data-act="p-<pa>"]` keyframe). */
export type PerformAct =
  | 'climb'
  | 'swing'
  | 'surf'
  | 'bask'
  | 'nap'
  | 'drink'
  | 'dig'
  | 'splash'
  | 'bounce'
  | 'glow'
  | 'gaze'
  | 'hang'
  | 'perch'
  | 'slide'

export type PropName =
  | 'vine'
  | 'trunk'
  | 'wave'
  | 'sunbeam'
  | 'pool'
  | 'pads'
  | 'mound'
  | 'cloud'
  | 'crystal'
  | 'stars'
  | 'stalactite'
  | 'slope'
  | 'branch'
  | 'nest'
  | 'lava'
  | 'ledge'
  | 'coral'
  | 'boulder'

/** Which locomotion types may use a spot ('any' = all). */
export type Eligible = Locomotion[] | 'any'

export interface PropArt {
  w: number
  h: number
  place: Place
  svg: string
}

export interface ActivitySpot {
  /** Horizontal position as a fraction of stage width [0,1]. */
  fx: number
  /** Vertical position as a fraction of stage height [0,1]. */
  fy: number
  eligible: Eligible
  prop: PropName
  anchor: Anchor
  pa: PerformAct
  mood: PetMood
  label: string
  w: number
  h: number
  place: Place
  svg: string
}

// ---------- prop artwork (environment objects) ----------
export const PROP_SVG: Record<PropName, PropArt> = {
  vine: {
    w: 46,
    h: 122,
    place: 'above',
    svg:
      '<svg viewBox="0 0 46 122" preserveAspectRatio="none">' +
      '<path class="vine-cord" d="M23 2 Q14 34 24 60 Q34 88 22 118" fill="none" stroke="#3f5e2c" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M24 30 q-13 -5 -18 3 q11 4 18 -3 Z" fill="#5f8a3f"/>' +
      '<path d="M23 56 q13 -5 18 3 q-11 4 -18 -3 Z" fill="#6f9c48"/>' +
      '<path d="M24 86 q-12 -4 -16 4 q10 3 16 -4 Z" fill="#5f8a3f"/>' +
      '<circle cx="22" cy="117" r="7" fill="none" stroke="#3f5e2c" stroke-width="4"/></svg>'
  },
  trunk: {
    w: 78,
    h: 150,
    place: 'center',
    svg:
      '<svg viewBox="0 0 78 150">' +
      '<ellipse class="canopy" cx="39" cy="36" rx="37" ry="30" fill="#3c6b39"/>' +
      '<ellipse class="canopy" cx="18" cy="44" rx="20" ry="16" fill="#4d7e44"/>' +
      '<ellipse class="canopy" cx="60" cy="44" rx="19" ry="15" fill="#33602f"/>' +
      '<rect x="31" y="52" width="16" height="96" rx="5" fill="#6b4a2c"/>' +
      '<path d="M39 86 q-11 4 -13 13 M39 108 q11 4 13 11" stroke="#553a22" stroke-width="4" fill="none" stroke-linecap="round"/></svg>'
  },
  wave: {
    w: 188,
    h: 96,
    place: 'center',
    svg:
      '<svg viewBox="0 0 188 96">' +
      '<g class="wv-back"><path d="M-20 56 Q40 26 94 50 Q150 74 208 46 L208 96 L-20 96 Z" fill="#2f8fae"/></g>' +
      '<g class="wv-front"><path d="M-20 68 Q40 42 94 64 Q150 84 208 60 L208 96 L-20 96 Z" fill="#1f6e88"/></g>' +
      '<path class="wv-crest" d="M62 50 Q86 16 124 36 Q150 48 150 48 Q120 38 104 52 Q90 64 62 50 Z" fill="#e2f4fb"/>' +
      '<path class="wv-foam" d="M48 56 Q96 34 150 52" stroke="#e2f4fb" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".8"/></svg>'
  },
  sunbeam: {
    w: 124,
    h: 54,
    place: 'center',
    svg:
      '<svg viewBox="0 0 124 54">' +
      '<defs><radialGradient id="sbm" cx="50%" cy="46%" r="56%">' +
      '<stop offset="0%" stop-color="#ffe7a0" stop-opacity=".92"/>' +
      '<stop offset="55%" stop-color="#ffd070" stop-opacity=".42"/>' +
      '<stop offset="100%" stop-color="#ffd070" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse class="beam" cx="62" cy="30" rx="58" ry="22" fill="url(#sbm)"/>' +
      '<ellipse cx="62" cy="30" rx="28" ry="10" fill="#fff3cf" opacity=".5"/></svg>'
  },
  pool: {
    w: 130,
    h: 56,
    place: 'center',
    svg:
      '<svg viewBox="0 0 130 56">' +
      '<ellipse cx="65" cy="36" rx="60" ry="17" fill="#2f7fae"/>' +
      '<ellipse cx="65" cy="31" rx="60" ry="15" fill="#3f97c8"/>' +
      '<ellipse class="rip rip1" cx="65" cy="30" rx="16" ry="5" fill="none" stroke="#cdeefb" stroke-width="2"/>' +
      '<ellipse class="rip rip2" cx="65" cy="30" rx="32" ry="9" fill="none" stroke="#cdeefb" stroke-width="1.6"/></svg>'
  },
  pads: {
    w: 130,
    h: 58,
    place: 'center',
    svg:
      '<svg viewBox="0 0 130 58">' +
      '<ellipse cx="65" cy="38" rx="60" ry="17" fill="#2f7fae"/>' +
      '<ellipse cx="65" cy="33" rx="60" ry="15" fill="#3f97c8"/>' +
      '<g class="pad"><ellipse cx="40" cy="33" rx="15" ry="7" fill="#4f8a45"/><path d="M40 33 L52 30" stroke="#2f7fae" stroke-width="2"/></g>' +
      '<g class="pad"><ellipse cx="86" cy="36" rx="13" ry="6" fill="#5a9a4e"/><path d="M86 36 L96 33" stroke="#2f7fae" stroke-width="2"/></g>' +
      '<ellipse class="rip rip1" cx="65" cy="32" rx="14" ry="4" fill="none" stroke="#cdeefb" stroke-width="1.6"/></svg>'
  },
  mound: {
    w: 122,
    h: 60,
    place: 'center',
    svg:
      '<svg viewBox="0 0 122 60">' +
      '<path d="M4 56 Q61 6 118 56 Z" fill="#8a5f37"/>' +
      '<path d="M4 56 Q61 20 118 56 Z" fill="#a87544"/>' +
      '<ellipse class="hole" cx="61" cy="50" rx="15" ry="6" fill="#523618"/>' +
      '<circle cx="42" cy="44" r="2.4" fill="#caa066"/><circle cx="82" cy="46" r="2" fill="#caa066"/></svg>'
  },
  cloud: {
    w: 150,
    h: 78,
    place: 'center',
    svg:
      '<svg viewBox="0 0 150 78"><g class="cloud-body" fill="#eef3fb">' +
      '<ellipse cx="46" cy="48" rx="33" ry="23"/><ellipse cx="92" cy="44" rx="39" ry="27"/>' +
      '<ellipse cx="120" cy="52" rx="25" ry="19"/><rect x="30" y="50" width="100" height="24" rx="12"/>' +
      '</g><g fill="#dbe4f3"><ellipse cx="60" cy="64" rx="40" ry="9"/></g></svg>'
  },
  crystal: {
    w: 92,
    h: 96,
    place: 'base',
    svg:
      '<svg viewBox="0 0 92 96">' +
      '<g class="cry-glow"><ellipse cx="46" cy="58" rx="40" ry="34" fill="#6fe0ff" opacity=".22"/></g>' +
      '<path d="M46 8 L62 58 L46 92 L30 58 Z" fill="#6fe0ff"/>' +
      '<path d="M24 36 L37 70 L24 92 L13 64 Z" fill="#4fc6ea"/>' +
      '<path d="M66 40 L78 70 L66 90 L56 66 Z" fill="#58d2f0"/>' +
      '<path d="M46 8 L52 30 L46 40 Z" fill="#bff3ff" opacity=".8"/></svg>'
  },
  stars: {
    w: 108,
    h: 78,
    place: 'center',
    svg:
      '<svg viewBox="0 0 108 78"><g class="star-grp" fill="#fff3c4">' +
      '<path d="M30 14 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3 Z"/>' +
      '<path class="tw" d="M78 34 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 Z"/>' +
      '<path class="tw" d="M58 8 l1.8 4.5 4.5 1.8 -4.5 1.8 -1.8 4.5 -1.8 -4.5 -4.5 -1.8 4.5 -1.8 Z"/>' +
      '<circle cx="92" cy="16" r="2"/><circle cx="16" cy="46" r="1.6"/><circle cx="46" cy="50" r="1.6"/></g></svg>'
  },
  stalactite: {
    w: 54,
    h: 96,
    place: 'above',
    svg:
      '<svg viewBox="0 0 54 96">' +
      '<path d="M2 0 H52 V10 Q27 18 2 10 Z" fill="#46414f"/>' +
      '<path d="M22 6 L32 6 L28 78 Z" fill="#5a5468"/>' +
      '<path d="M25 6 L30 6 L28 78 Z" fill="#6f6880"/>' +
      '<circle class="drip" cx="28" cy="80" r="2.4" fill="#9fe6ff"/></svg>'
  },
  slope: {
    w: 162,
    h: 92,
    place: 'base',
    svg:
      '<svg viewBox="0 0 162 92">' +
      '<path d="M8 88 L138 18 L156 88 Z" fill="#cfe2f4"/>' +
      '<path d="M8 88 L138 18 L142 28 L24 90 Z" fill="#ffffff"/>' +
      '<g class="spark" fill="#ffffff"><circle cx="70" cy="56" r="1.6"/><circle cx="96" cy="44" r="1.4"/><circle cx="52" cy="66" r="1.3"/></g></svg>'
  },
  branch: {
    w: 122,
    h: 46,
    place: 'center',
    svg:
      '<svg viewBox="0 0 122 46">' +
      '<path class="br-bend" d="M2 22 Q44 16 120 26" fill="none" stroke="#5a4327" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M70 20 q-7 -13 -20 -12 q9 6 7 15 Z" fill="#4f7a3a"/>' +
      '<path d="M44 22 q-6 -10 -16 -10 q7 5 6 12 Z" fill="#5e8c45"/></svg>'
  },
  nest: {
    w: 116,
    h: 48,
    place: 'center',
    svg:
      '<svg viewBox="0 0 116 48">' +
      '<ellipse cx="58" cy="32" rx="52" ry="15" fill="#7a5a33"/>' +
      '<ellipse cx="58" cy="28" rx="44" ry="12" fill="#5f4727"/>' +
      '<ellipse cx="58" cy="27" rx="33" ry="8" fill="#caa66e"/>' +
      '<path d="M14 30 Q40 22 58 24 M102 30 Q76 22 58 24" stroke="#8a6a3f" stroke-width="2" fill="none" opacity=".7"/></svg>'
  },
  lava: {
    w: 132,
    h: 58,
    place: 'center',
    svg:
      '<svg viewBox="0 0 132 58">' +
      '<ellipse class="cry-glow" cx="66" cy="34" rx="62" ry="22" fill="#ff5a1e" opacity=".25"/>' +
      '<ellipse cx="66" cy="38" rx="58" ry="16" fill="#3a2218"/>' +
      '<ellipse class="lava-melt" cx="66" cy="35" rx="48" ry="12" fill="#ff7a2c"/>' +
      '<ellipse cx="66" cy="34" rx="38" ry="8" fill="#ffb24a"/>' +
      '<path d="M40 35 L52 33 M76 36 L90 34" stroke="#ffd27a" stroke-width="2" stroke-linecap="round" opacity=".7"/>' +
      '<circle class="lava-b1" cx="52" cy="34" r="3" fill="#ffe2a0"/>' +
      '<circle class="lava-b2" cx="84" cy="36" r="2.4" fill="#ffe2a0"/></svg>'
  },
  ledge: {
    w: 118,
    h: 44,
    place: 'center',
    svg:
      '<svg viewBox="0 0 118 44">' +
      '<path d="M6 22 Q12 14 30 14 L96 16 Q112 18 112 26 L108 36 Q58 42 12 34 Z" fill="#6b6258"/>' +
      '<path d="M12 20 Q40 14 100 18 Q108 19 108 23 Q58 28 14 24 Z" fill="#8a8175"/>' +
      '<path d="M16 32 Q58 37 102 31" stroke="#544c44" stroke-width="1.6" fill="none" opacity=".6"/></svg>'
  },
  coral: {
    w: 96,
    h: 64,
    place: 'center',
    svg:
      '<svg viewBox="0 0 96 64">' +
      '<path d="M16 62 Q12 32 28 32 Q26 18 40 22 Q48 30 60 24 Q76 26 72 42 Q84 44 80 62 Z" fill="#cf6f5c"/>' +
      '<ellipse cx="46" cy="31" rx="25" ry="7" fill="#e08a76"/>' +
      '<circle cx="32" cy="30" r="3" fill="#f2ac96"/><circle cx="56" cy="28" r="2.4" fill="#f2ac96"/>' +
      '<path d="M22 62 Q24 46 18 40 M74 62 Q72 44 80 38" stroke="#bb5e4d" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'
  },
  boulder: {
    w: 88,
    h: 84,
    place: 'center',
    svg:
      '<svg viewBox="0 0 88 84">' +
      '<path d="M8 80 Q4 40 24 30 Q40 14 60 26 Q82 36 80 80 Z" fill="#7a7066"/>' +
      '<path d="M24 30 Q40 14 60 26 Q50 34 38 34 Q28 34 24 30 Z" fill="#968c83"/>' +
      '<path d="M30 80 Q34 56 26 46 M58 80 Q56 54 66 48" stroke="#5f564e" stroke-width="2.5" fill="none"/></svg>'
  }
}

// ---------- action → prop + pet behaviour ----------
interface ActDef {
  prop: PropName
  anchor: Anchor
  pa: PerformAct
  mood: PetMood
  label: string
}

const ACT: Record<string, ActDef> = {
  climb: { prop: 'trunk', anchor: 'climb', pa: 'climb', mood: 'focused', label: 'Climb' },
  swing: { prop: 'vine', anchor: 'swing', pa: 'swing', mood: 'happy', label: 'Swing' },
  surf: { prop: 'wave', anchor: 'onwave', pa: 'surf', mood: 'celebrate', label: 'Surf' },
  bask: { prop: 'sunbeam', anchor: 'on', pa: 'bask', mood: 'love', label: 'Bask' },
  tan: { prop: 'sunbeam', anchor: 'on', pa: 'bask', mood: 'love', label: 'Sunbathe' },
  sunbathe: { prop: 'sunbeam', anchor: 'on', pa: 'bask', mood: 'love', label: 'Sunbathe' },
  warm: { prop: 'lava', anchor: 'beside', pa: 'bask', mood: 'happy', label: 'Warm up' },
  nap: { prop: 'nest', anchor: 'on', pa: 'nap', mood: 'sleep', label: 'Nap' },
  rest: { prop: 'nest', anchor: 'on', pa: 'nap', mood: 'tired', label: 'Rest' },
  drink: { prop: 'pool', anchor: 'beside', pa: 'drink', mood: 'focused', label: 'Drink' },
  dig: { prop: 'mound', anchor: 'on', pa: 'dig', mood: 'focused', label: 'Dig' },
  forage: { prop: 'mound', anchor: 'on', pa: 'dig', mood: 'focused', label: 'Forage' },
  splash: { prop: 'pads', anchor: 'on', pa: 'splash', mood: 'happy', label: 'Splash' },
  hop: { prop: 'pads', anchor: 'on', pa: 'splash', mood: 'happy', label: 'Hop pads' },
  play: { prop: 'pads', anchor: 'on', pa: 'splash', mood: 'playful', label: 'Play' },
  bounce: { prop: 'cloud', anchor: 'on', pa: 'bounce', mood: 'happy', label: 'Bounce' },
  glow: { prop: 'crystal', anchor: 'beside', pa: 'glow', mood: 'celebrate', label: 'Glow' },
  gaze: { prop: 'stars', anchor: 'under', pa: 'gaze', mood: 'love', label: 'Stargaze' },
  hang: { prop: 'stalactite', anchor: 'hang', pa: 'hang', mood: 'playful', label: 'Hang' },
  perch: { prop: 'branch', anchor: 'on', pa: 'perch', mood: 'idle', label: 'Perch' },
  lurk: { prop: 'branch', anchor: 'on', pa: 'perch', mood: 'focused', label: 'Lurk' },
  slide: { prop: 'slope', anchor: 'ontop', pa: 'slide', mood: 'happy', label: 'Slide' }
}

/** Vertical bands as a fraction of stage height. */
export const FY: Record<string, number> = {
  ground: 0.84,
  low: 0.66,
  mid: 0.5,
  high: 0.32,
  sky: 0.22
}

type FyBand = keyof typeof FY

interface RawSpot {
  fx: number
  band: FyBand
  act: string
  eligible: Eligible
  prop?: PropName
}

const RAW: Record<Habitat, RawSpot[]> = {
  home: [
    { fx: 0.5, band: 'ground', act: 'nap', eligible: ['walk'] },
    { fx: 0.28, band: 'low', act: 'sunbathe', eligible: 'any' },
    { fx: 0.82, band: 'mid', act: 'perch', eligible: ['walk', 'fly'], prop: 'ledge' }
  ],
  forest: [
    { fx: 0.16, band: 'high', act: 'climb', eligible: 'any' },
    { fx: 0.74, band: 'low', act: 'perch', eligible: ['walk', 'fly'] },
    { fx: 0.46, band: 'ground', act: 'drink', eligible: ['walk'] }
  ],
  jungle: [
    { fx: 0.32, band: 'mid', act: 'swing', eligible: 'any' },
    { fx: 0.72, band: 'high', act: 'climb', eligible: 'any' },
    { fx: 0.5, band: 'ground', act: 'forage', eligible: ['walk'] }
  ],
  grassland: [
    { fx: 0.72, band: 'low', act: 'bask', eligible: 'any' },
    { fx: 0.46, band: 'ground', act: 'forage', eligible: ['walk'] },
    { fx: 0.2, band: 'ground', act: 'nap', eligible: ['walk'] }
  ],
  desert: [
    { fx: 0.5, band: 'low', act: 'tan', eligible: 'any' },
    { fx: 0.22, band: 'low', act: 'rest', eligible: 'any' },
    { fx: 0.78, band: 'ground', act: 'dig', eligible: ['walk'] }
  ],
  wetland: [
    { fx: 0.46, band: 'low', act: 'hop', eligible: 'any' },
    { fx: 0.16, band: 'mid', act: 'perch', eligible: ['walk', 'fly'] },
    { fx: 0.74, band: 'ground', act: 'splash', eligible: 'any' }
  ],
  swamp: [
    { fx: 0.5, band: 'ground', act: 'perch', eligible: ['walk'] },
    { fx: 0.72, band: 'low', act: 'hop', eligible: 'any' },
    { fx: 0.24, band: 'ground', act: 'lurk', eligible: ['swim', 'walk'] }
  ],
  mountain: [
    { fx: 0.55, band: 'high', act: 'climb', eligible: ['walk', 'fly'], prop: 'boulder' },
    { fx: 0.84, band: 'mid', act: 'perch', eligible: ['fly', 'walk'], prop: 'ledge' },
    { fx: 0.24, band: 'low', act: 'gaze', eligible: 'any' }
  ],
  cave: [
    { fx: 0.48, band: 'low', act: 'glow', eligible: 'any' },
    { fx: 0.3, band: 'high', act: 'hang', eligible: ['fly'] },
    { fx: 0.7, band: 'ground', act: 'drink', eligible: ['walk'] }
  ],
  volcano: [
    { fx: 0.5, band: 'ground', act: 'warm', eligible: ['walk'] },
    { fx: 0.8, band: 'ground', act: 'perch', eligible: ['walk'], prop: 'ledge' },
    { fx: 0.22, band: 'ground', act: 'dig', eligible: ['walk'] }
  ],
  tundra: [
    { fx: 0.5, band: 'low', act: 'slide', eligible: ['walk', 'swim'] },
    { fx: 0.24, band: 'ground', act: 'dig', eligible: ['walk'] },
    { fx: 0.76, band: 'high', act: 'gaze', eligible: 'any' }
  ],
  ocean: [
    { fx: 0.5, band: 'high', act: 'surf', eligible: ['swim', 'fly'] },
    { fx: 0.46, band: 'low', act: 'perch', eligible: 'any', prop: 'coral' },
    { fx: 0.26, band: 'ground', act: 'glow', eligible: ['swim', 'walk'] }
  ],
  sky: [
    { fx: 0.3, band: 'low', act: 'bounce', eligible: 'any' },
    { fx: 0.68, band: 'mid', act: 'bask', eligible: 'any' },
    { fx: 0.56, band: 'ground', act: 'nap', eligible: 'any' }
  ],
  city: [
    { fx: 0.3, band: 'mid', act: 'perch', eligible: ['fly', 'walk'], prop: 'ledge' },
    { fx: 0.7, band: 'high', act: 'gaze', eligible: 'any' },
    { fx: 0.5, band: 'ground', act: 'rest', eligible: ['walk'] }
  ]
}

function buildSpots(raw: RawSpot[]): ActivitySpot[] {
  return raw.map((a) => {
    const def = ACT[a.act] ?? ACT.perch
    const propName = a.prop ?? def.prop
    const prop = PROP_SVG[propName] ?? PROP_SVG.branch
    return {
      fx: a.fx,
      fy: FY[a.band],
      eligible: a.eligible,
      prop: propName,
      anchor: def.anchor,
      pa: def.pa,
      mood: def.mood,
      label: def.label,
      w: prop.w,
      h: prop.h,
      place: prop.place,
      svg: prop.svg
    }
  })
}

export const HABITAT_ACTIVITIES: Record<Habitat, ActivitySpot[]> = Object.fromEntries(
  (Object.keys(RAW) as Habitat[]).map((h) => [h, buildSpots(RAW[h])])
) as Record<Habitat, ActivitySpot[]>

export function habitatActivities(h: Habitat): ActivitySpot[] {
  return HABITAT_ACTIVITIES[h] ?? []
}

/** Is a locomotion type allowed to use this spot? */
export function spotEligible(spot: ActivitySpot, loco: Locomotion): boolean {
  return spot.eligible === 'any' || spot.eligible.indexOf(loco) >= 0
}

/**
 * Top-left position where a pet of box `size` settles to perform on `spot`,
 * given a stage of `W`×`H` and an optional prop scale. Pure so the seek/settle
 * geometry can be unit-tested. Mirrors the diorama engine's anchor math.
 */
export function anchorTarget(
  spot: ActivitySpot,
  size: number,
  W: number,
  H: number,
  propScale = 1
): { x: number; y: number } {
  const px = spot.fx * W
  const py = spot.fy * H
  const S = size
  const dw = spot.w * propScale
  const dh = spot.h * propScale
  switch (spot.anchor) {
    case 'on':
      return { x: px - S / 2, y: py - S * 0.92 }
    case 'ontop':
      return { x: px - S * 0.5 - dw * 0.05, y: py - dh * 0.42 - S * 0.46 }
    case 'onwave':
      return { x: px - S / 2, y: py - S * 0.78 }
    case 'under':
      return { x: px - S / 2, y: H - S * 0.95 }
    case 'beside':
      return { x: px + dw * 0.3, y: py - S * 0.86 }
    case 'hang':
      return { x: px - S / 2, y: py + S * 0.04 }
    case 'swing':
      return { x: px - S / 2, y: py - S / 2 }
    case 'climb':
      return { x: px - S * 0.44, y: py - S * 0.52 }
    default:
      return { x: px - S / 2, y: py - S * 0.5 }
  }
}

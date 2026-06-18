import { readFileSync, writeFileSync } from 'node:fs'

const SRC = '/Users/anthonycontreras/Documents/Rosendin_Summer2026/Timelog/art/scenes'
const OUT =
  '/Users/anthonycontreras/Documents/Rosendin_Summer2026/Timelog/src/shared/habitats.ts'

// [habitat id, CONST name, display name, CSS background tint] — order preserved
// from the previous HABITAT_THEMES map for a minimal diff.
const HABITATS = [
  ['home', 'HOME_SCENE', 'Home', 'radial-gradient(120% 80% at 50% 0%, rgba(240, 149, 76, 0.06), transparent 60%)'],
  ['forest', 'FOREST_SCENE', 'Forest', 'linear-gradient(180deg, rgba(28, 58, 42, 0), rgba(20, 60, 40, 0.35))'],
  ['ocean', 'OCEAN_SCENE', 'Ocean', 'linear-gradient(180deg, rgba(20, 40, 70, 0.1), rgba(12, 40, 80, 0.4))'],
  ['jungle', 'JUNGLE_SCENE', 'Jungle', 'linear-gradient(180deg, rgba(18, 50, 30, 0.15), rgba(12, 45, 28, 0.45))'],
  ['grassland', 'GRASSLAND_SCENE', 'Grassland', 'linear-gradient(180deg, rgba(80, 78, 36, 0.1), rgba(70, 70, 32, 0.32))'],
  ['desert', 'DESERT_SCENE', 'Desert', 'linear-gradient(180deg, rgba(120, 86, 44, 0.12), rgba(110, 74, 38, 0.36))'],
  ['wetland', 'WETLAND_SCENE', 'Wetland', 'linear-gradient(180deg, rgba(28, 60, 54, 0.12), rgba(20, 58, 50, 0.38))'],
  ['mountain', 'MOUNTAIN_SCENE', 'Mountain', 'linear-gradient(180deg, rgba(50, 60, 84, 0.14), rgba(38, 48, 70, 0.34))'],
  ['tundra', 'TUNDRA_SCENE', 'Tundra', 'linear-gradient(180deg, rgba(120, 145, 175, 0.14), rgba(90, 120, 150, 0.3))'],
  ['city', 'CITY_SCENE', 'City', 'linear-gradient(180deg, rgba(30, 32, 46, 0.16), rgba(20, 22, 34, 0.4))'],
  ['swamp', 'SWAMP_SCENE', 'Swamp', 'linear-gradient(180deg, rgba(30, 40, 28, 0.15), rgba(22, 34, 24, 0.42))'],
  ['cave', 'CAVE_SCENE', 'Cave', 'linear-gradient(180deg, rgba(20, 18, 30, 0.2), rgba(14, 12, 22, 0.5))'],
  ['volcano', 'VOLCANO_SCENE', 'Volcano', 'linear-gradient(180deg, rgba(40, 18, 14, 0.18), rgba(60, 20, 10, 0.4))'],
  ['sky', 'SKY_SCENE', 'Sky', 'linear-gradient(180deg, rgba(60, 40, 90, 0.18), rgba(30, 30, 70, 0.18))']
]

const loadScene = (id) => {
  const raw = readFileSync(`${SRC}/${id}.svg`, 'utf8').trim()
  if (raw.includes('`') || raw.includes('${'))
    throw new Error(`unsafe template chars in ${id}.svg`)
  if (!raw.startsWith('<svg') || !raw.endsWith('</svg>'))
    throw new Error(`not a single <svg> root in ${id}.svg`)
  return raw
}

const header = `/**
 * Habitat themes — the "living habitat" backdrop behind the pets on the panel.
 *
 * Each habitat has a CSS background tint plus a rich inline SVG scene
 * (viewBox 0 0 320 480) authored by the art pipeline (see SPRITE_ART_PROMPTS.md)
 * and rendered behind the UI on the panel and inside the Zoo dioramas. The scene
 * markup is trusted built-in art, injected directly. Pure + asset-free so it can
 * be unit-tested and imported from both main and renderer.
 *
 * To refresh a scene: drop a new <id>.svg into the art folder and re-run the
 * generator, or paste its markup into the matching *_SCENE constant below.
 */
import type { Habitat } from './types'

export interface HabitatTheme {
  id: Habitat
  name: string
  /** CSS \`background\` value layered under the scene. */
  background: string
  /** Decorative inline SVG (viewBox 0 0 320 480), or '' for none. */
  scene: string
}
`

const sceneConsts = HABITATS.map(
  ([id, constName]) => `\nconst ${constName} =\n  \`${loadScene(id)}\``
).join('\n')

const themeEntries = HABITATS.map(
  ([id, constName, name, bg]) =>
    `  ${id}: {\n    id: '${id}',\n    name: '${name}',\n    background: '${bg}',\n    scene: ${constName}\n  }`
).join(',\n')

const footer = `

export const HABITAT_THEMES: Record<Habitat, HabitatTheme> = {
${themeEntries}
}

export function habitatTheme(h: Habitat): HabitatTheme {
  return HABITAT_THEMES[h]
}
`

writeFileSync(OUT, header + sceneConsts + footer + '\n', 'utf8')
console.log(`wrote ${OUT} with ${HABITATS.length} scenes`)

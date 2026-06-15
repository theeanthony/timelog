/** Color themes: a few curated presets plus a user-editable 'custom' palette.
 *  Presets are applied by overriding CSS custom properties on the document root,
 *  layered on top of the dark/light baseline in main.css (via data-theme=base). */

export type ThemeBase = 'dark' | 'light'

export interface Theme {
  id: string
  name: string
  base: ThemeBase
  /** Variable overrides. Empty for built-in dark/light (baseline handles them). */
  vars: Record<string, string>
}

/** The base palette variables a custom theme may override, in editor order. */
export const EDITABLE_VARS: { var: string; label: string }[] = [
  { var: '--bg', label: 'background' },
  { var: '--bg-raised', label: 'raised surface' },
  { var: '--bg-inset', label: 'inset / inputs' },
  { var: '--text', label: 'text' },
  { var: '--text-dim', label: 'dim text' },
  { var: '--auto-bright', label: 'auto accent' },
  { var: '--auto-deep', label: 'auto accent (deep)' },
  { var: '--manual-bright', label: 'manual accent' },
  { var: '--manual-deep', label: 'manual accent (deep)' },
  { var: '--warn', label: 'warning' },
  { var: '--pet-accent', label: 'pet accent' },
  { var: '--pet-eye', label: 'pet eyes' }
]

export const THEMES: Theme[] = [
  { id: 'dark', name: 'Dark', base: 'dark', vars: {} },
  { id: 'light', name: 'Light', base: 'light', vars: {} },
  { id: 'system', name: 'System', base: 'dark', vars: {} },
  {
    id: 'midnight',
    name: 'Midnight',
    base: 'dark',
    vars: {
      '--bg': '#0d1117',
      '--bg-raised': '#161b22',
      '--bg-inset': '#0a0d12',
      '--text': '#e6edf3',
      '--text-dim': '#8b949e',
      '--auto-deep': '#1f3a8a',
      '--auto-bright': '#6ea8fe',
      '--manual-deep': '#0e7490',
      '--manual-bright': '#38bdf8',
      '--warn': '#e3b341',
      '--pet-accent': '#6ea8fe',
      '--pet-eye': '#0d1117'
    }
  },
  {
    id: 'solarized',
    name: 'Solarized',
    base: 'light',
    vars: {
      '--bg': '#fdf6e3',
      '--bg-raised': '#fffdf5',
      '--bg-inset': '#eee8d5',
      '--text': '#073642',
      '--text-dim': '#657b83',
      '--auto-deep': '#268bd2',
      '--auto-bright': '#2176c7',
      '--manual-deep': '#cb4b16',
      '--manual-bright': '#b58900',
      '--warn': '#b58900',
      '--pet-accent': '#cb4b16',
      '--pet-eye': '#073642'
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    base: 'dark',
    vars: {
      '--bg': '#0f1a14',
      '--bg-raised': '#16241c',
      '--bg-inset': '#0a120d',
      '--text': '#e8f0ea',
      '--text-dim': '#8aa394',
      '--auto-deep': '#1f6f43',
      '--auto-bright': '#4ade80',
      '--manual-deep': '#92611a',
      '--manual-bright': '#d9a441',
      '--warn': '#d9a441',
      '--pet-accent': '#4ade80',
      '--pet-eye': '#0f1a14'
    }
  }
]

export const PRESET_THEMES = THEMES

function systemPrefersLight(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: light)').matches
    : false
}

/**
 * Resolve a theme id (+ the custom palette) to the dark/light baseline and the
 * concrete variable overrides to apply. `prefersLight` is injectable for tests.
 */
export function resolveTheme(
  theme: string,
  customColors: Record<string, string> = {},
  prefersLight: boolean = systemPrefersLight()
): { base: ThemeBase; vars: Record<string, string> } {
  if (theme === 'system') return { base: prefersLight ? 'light' : 'dark', vars: {} }
  if (theme === 'custom') {
    const { __base, ...vars } = customColors
    return { base: __base === 'light' ? 'light' : 'dark', vars }
  }
  const preset = THEMES.find((t) => t.id === theme)
  if (preset) return { base: preset.base, vars: preset.vars }
  return { base: 'dark', vars: {} }
}

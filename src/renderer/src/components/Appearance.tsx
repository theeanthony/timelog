import { useState } from 'react'
import type { CustomPet, Prefs } from '../../../shared/types'
import { EDITABLE_VARS, THEMES } from '../../../shared/themes'
import { allPets, PETS } from '../pets/registry'
import { sanitizePetSvg } from '../pets/sanitize'
import { Row, Toggle } from './SettingsControls'

interface Props {
  prefs: Prefs
  update: (patch: Partial<Prefs>) => Promise<void>
}

const HEX = /^#[0-9a-fA-F]{6}$/

function readVarColor(name: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return HEX.test(v) ? v : '#888888'
}

/** Theme presets + a custom palette editor + pet companions (incl. upload). */
export function Appearance({ prefs, update }: Props): React.JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const isCustom = prefs.theme === 'custom'
  const customBase = prefs.customColors.__base === 'light' ? 'light' : 'dark'

  const chooseTheme = (id: string): void => {
    if (id !== 'custom') {
      void update({ theme: id })
      return
    }
    // Seed the custom palette from whatever's on screen now, unless one exists.
    if (Object.keys(prefs.customColors).length > 0) {
      void update({ theme: 'custom' })
      return
    }
    const seed: Record<string, string> = {
      __base: (document.documentElement.dataset.theme as 'dark' | 'light') ?? 'dark'
    }
    for (const { var: name } of EDITABLE_VARS) seed[name] = readVarColor(name)
    void update({ theme: 'custom', customColors: seed })
  }

  const setColor = (name: string, value: string): void => {
    void update({ customColors: { ...prefs.customColors, [name]: value } })
  }

  const setBase = (base: 'dark' | 'light'): void => {
    void update({ customColors: { ...prefs.customColors, __base: base } })
  }

  // ── pets ──
  const petOptions = allPets(prefs.customPets)
  const setPetAt = (i: number, id: string): void =>
    void update({ pets: prefs.pets.map((p, idx) => (idx === i ? id : p)) })
  const removePetAt = (i: number): void =>
    void update({ pets: prefs.pets.filter((_, idx) => idx !== i) })
  const addPet = (): void => {
    if (prefs.pets.length < 3) void update({ pets: [...prefs.pets, PETS[0].id] })
  }

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const svg = sanitizePetSvg(await file.text())
    if (!svg) {
      setError("that file isn't a usable SVG")
      return
    }
    const pet: CustomPet = {
      id: `custom-${Date.now()}`,
      name: file.name.replace(/\.svg$/i, '').slice(0, 24) || 'custom',
      svg,
      body: '#9aa0ad',
      accent: '#f0954c',
      eye: '#14131a'
    }
    setError(null)
    await update({ customPets: [...prefs.customPets, pet] })
  }

  const removeCustom = (id: string): void =>
    void update({
      customPets: prefs.customPets.filter((p) => p.id !== id),
      pets: prefs.pets.filter((p) => p !== id)
    })

  return (
    <>
      <h2 className="set-group">appearance</h2>
      <div className="theme-chips" role="radiogroup" aria-label="theme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={prefs.theme === t.id}
            className={`chip${prefs.theme === t.id ? ' chip--on' : ''}`}
            onClick={() => chooseTheme(t.id)}
          >
            {t.name.toLowerCase()}
          </button>
        ))}
        <button
          type="button"
          role="radio"
          aria-checked={isCustom}
          className={`chip${isCustom ? ' chip--on' : ''}`}
          onClick={() => chooseTheme('custom')}
        >
          custom
        </button>
      </div>

      {isCustom && (
        <div className="custom-colors">
          <Row label="base">
            <div className="seg">
              <button
                type="button"
                className={`seg-btn${customBase === 'dark' ? ' seg-btn--on' : ''}`}
                onClick={() => setBase('dark')}
              >
                dark
              </button>
              <button
                type="button"
                className={`seg-btn${customBase === 'light' ? ' seg-btn--on' : ''}`}
                onClick={() => setBase('light')}
              >
                light
              </button>
            </div>
          </Row>
          {EDITABLE_VARS.map(({ var: name, label }) => {
            const value = prefs.customColors[name] ?? readVarColor(name)
            return (
              <Row key={name} label={label}>
                <input
                  type="color"
                  className="color-input"
                  value={HEX.test(value) ? value : '#888888'}
                  onChange={(e) => setColor(name, e.target.value)}
                  aria-label={label}
                />
              </Row>
            )
          })}
        </div>
      )}

      <h2 className="set-group">pets</h2>
      <Row label="show pets">
        <Toggle
          label="show pets"
          checked={prefs.petsEnabled}
          onChange={(v) => void update({ petsEnabled: v })}
        />
      </Row>
      {prefs.petsEnabled && (
        <>
          {prefs.pets.map((id, i) => (
            <div className="pet-slot" key={i}>
              <select
                className="input input--select"
                value={id}
                onChange={(e) => setPetAt(i, e.target.value)}
                aria-label={`pet ${i + 1}`}
              >
                {petOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn--icon"
                aria-label="remove pet"
                disabled={prefs.pets.length <= 1}
                onClick={() => removePetAt(i)}
              >
                ✕
              </button>
            </div>
          ))}
          {prefs.pets.length < 3 && (
            <button type="button" className="btn add-pet" onClick={addPet}>
              + add pet
            </button>
          )}

          <Row label="custom pet" hint="upload your own SVG">
            <label className="btn upload-btn">
              upload
              <input
                type="file"
                accept="image/svg+xml,.svg"
                className="upload-input"
                onChange={onUpload}
              />
            </label>
          </Row>
          {error && <div className="form-error">{error}</div>}
          {prefs.customPets.map((p) => (
            <div className="pet-slot" key={p.id}>
              <span className="custom-pet-name">{p.name}</span>
              <button
                type="button"
                className="btn--icon"
                aria-label={`remove ${p.name}`}
                onClick={() => removeCustom(p.id)}
              >
                ✕
              </button>
            </div>
          ))}
        </>
      )}
    </>
  )
}

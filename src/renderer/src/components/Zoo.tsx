import { useEffect, useMemo, useState } from 'react'
import type { Prefs, SpriteVariant } from '../../../shared/types'
import {
  eggsEarned,
  hatchUpTo,
  unlockProgress,
  mergeCollection,
  groupByHabitat,
  rarityCounts,
  RARITIES
} from '../../../shared/zoo'
import { HABITATS, HABITAT_NAMES, speciesInHabitat } from '../../../shared/species'
import { habitatTheme } from '../../../shared/habitats'
import { RARITY_COLOR, RARITY_LABEL } from '../../../shared/variant'
import { encodeVariant, decodeVariant } from '../../../shared/sprite-codes'
import { VariantSprite } from './VariantSprite'
import { PetLayer } from './PetLayer'
import { AmbientLayer } from './AmbientLayer'
import { PerchOverlay } from './PerchOverlay'
import { DioramaLayer } from './DioramaLayer'
import { DayNight } from './DayNight'
import { tintForHour } from '../../../shared/daynight'

interface Props {
  prefs: Prefs
  update: (patch: Partial<Prefs>) => Promise<void>
  onClose: () => void
}

const MAX_PARTY = 3

function fmtDur(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60_000))
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/**
 * The Zoo: a gallery of every collected critter, grouped by habitat. Critters
 * are earned from cumulative tracked time (a few starters + one per hour);
 * imported/traded critters are merged on top. Click a critter to add/remove it
 * from the companion party that roams the panel.
 */
export function Zoo({ prefs, update, onClose }: Props): React.JSX.Element {
  const [lifetimeMs, setLifetimeMs] = useState(0)
  const [importText, setImportText] = useState('')
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [showTrade, setShowTrade] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Ensure a stable per-install salt so the earned collection is consistent.
  useEffect(() => {
    if (!prefs.spriteSalt) {
      const salt =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `s-${Date.now().toString(36)}`
      void update({ spriteSalt: salt })
    }
  }, [prefs.spriteSalt, update])

  // Lifetime tracked time → earned critters. One wide range query, summed.
  useEffect(() => {
    const start = new Date(Date.now() - 420 * 86_400_000).toISOString().slice(0, 10)
    void window.timelog
      .getRangeBreakdown('month', start, 420)
      .then((rb) => setLifetimeMs(rb.totals.reduce((sum, r) => sum + r.totalMs, 0)))
      .catch(() => setLifetimeMs(0))
  }, [])

  const salt = prefs.spriteSalt || 'starter'
  const collection = useMemo(
    () => mergeCollection(hatchUpTo(salt, eggsEarned(lifetimeMs)), prefs.collection),
    [salt, lifetimeMs, prefs.collection]
  )
  const groups = useMemo(() => groupByHabitat(collection), [collection])
  const counts = useMemo(() => rarityCounts(collection), [collection])
  const progress = unlockProgress(lifetimeMs)

  const party = prefs.party
  const inParty = (v: SpriteVariant): boolean => party.some((p) => p.seed === v.seed)

  const toggleParty = (v: SpriteVariant): void => {
    if (inParty(v)) {
      void update({ party: party.filter((p) => p.seed !== v.seed) })
    } else if (party.length < MAX_PARTY) {
      void update({ party: [...party, v] })
    }
  }

  const partyFull = party.length >= MAX_PARTY

  // Time-of-day for the scene lighting: forced hour, or the live clock hour.
  const autoDayNight = prefs.dayNightHour === null
  const effHour = prefs.dayNightHour ?? new Date().getHours()
  const dayLabel = tintForHour(effHour).label

  const copyCode = (v: SpriteVariant): void => {
    void navigator.clipboard?.writeText(encodeVariant(v)).then(
      () => {
        setCopied(v.seed)
        window.setTimeout(() => setCopied(null), 1200)
      },
      () => setImportMsg('could not copy')
    )
  }

  const importCode = (): void => {
    const v = decodeVariant(importText)
    if (!v) {
      setImportMsg('invalid code')
      return
    }
    void update({ collection: mergeCollection(prefs.collection, [v]) })
    setImportText('')
    setImportMsg(`imported a ${v.rarity} ${v.species}!`)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet sheet--zoo"
        role="dialog"
        aria-label="zoo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <span className="sheet-title">zoo · {collection.length} critters</span>
          <button type="button" className="btn--icon" aria-label="close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* active habitat backdrop */}
        <div className="zoo-biomes">
          <span className="zoo-party-label">habitat</span>
          <div className="zoo-biomes-row">
            {HABITATS.map((h) => (
              <button
                key={h}
                type="button"
                className={`zoo-biome${prefs.activeHabitat === h ? ' zoo-biome--on' : ''}`}
                onClick={() => void update({ activeHabitat: h })}
              >
                {HABITAT_NAMES[h]}
              </button>
            ))}
          </div>
        </div>

        {/* time of day */}
        <div className="zoo-daynight">
          <span className="zoo-daynight-icon">{effHour >= 6 && effHour < 19 ? '☀' : '☾'}</span>
          <input
            type="range"
            min={0}
            max={23}
            value={effHour}
            aria-label="time of day"
            onChange={(e) => void update({ dayNightHour: Number(e.target.value) })}
          />
          <span className="zoo-daynight-val">
            {String(effHour).padStart(2, '0')}:00 · {dayLabel}
          </span>
          <button
            type="button"
            className={`zoo-daynight-auto${autoDayNight ? ' zoo-daynight-auto--on' : ''}`}
            title="follow the real clock"
            onClick={() => void update({ dayNightHour: autoDayNight ? effHour : null })}
          >
            auto
          </button>
        </div>

        {/* companions + progress */}
        <div className="zoo-top">
          <div className="zoo-party">
            <span className="zoo-party-label">companions</span>
            <div className="zoo-party-row">
              {party.length === 0 && <span className="zoo-hint">pick up to 3 below</span>}
              {party.map((v) => (
                <button
                  key={v.seed}
                  type="button"
                  className="zoo-party-chip"
                  title="remove from party"
                  onClick={() => toggleParty(v)}
                >
                  <VariantSprite variant={v} size={28} />
                </button>
              ))}
            </div>
          </div>
          <div className="zoo-progress" title={`next critter in ${fmtDur(progress.msToNext)}`}>
            <div className="zoo-progress-bar">
              <span style={{ width: `${Math.round(progress.fractionToNext * 100)}%` }} />
            </div>
            <span className="zoo-hint">next in {fmtDur(progress.msToNext)}</span>
          </div>
        </div>

        {/* rarity legend */}
        <div className="zoo-legend">
          {RARITIES.map((r) => (
            <span key={r} className="zoo-legend-item">
              <i style={{ background: RARITY_COLOR[r] }} />
              {RARITY_LABEL[r]} {counts[r]}
            </span>
          ))}
        </div>

        {/* habitats */}
        <div className="zoo-scroll">
          {groups.map((g) => (
            <section key={g.habitat} className="zoo-habitat">
              <div className="zoo-stage">
                <div
                  className="zoo-habitat-bg"
                  style={{ background: habitatTheme(g.habitat).background }}
                  aria-hidden
                >
                  {habitatTheme(g.habitat).scene && (
                    <span
                      className="zoo-habitat-scene"
                      dangerouslySetInnerHTML={{ __html: habitatTheme(g.habitat).scene }}
                    />
                  )}
                </div>
                <AmbientLayer habitat={g.habitat} density={0.7} />
                <PerchOverlay habitat={g.habitat} />
                <DioramaLayer
                  habitat={g.habitat}
                  mood="idle"
                  creatureSize={48}
                  propScale={0.45}
                  interactive
                />
                {g.items.length > 0 && <PetLayer party={g.items.slice(0, 5)} mood="idle" />}
                <DayNight hour={effHour} />
                <h3 className="zoo-stage-label">
                  {HABITAT_NAMES[g.habitat]}
                  <span className="zoo-habitat-count">{g.items.length}</span>
                </h3>
              </div>
              {g.items.length === 0 ? (
                <p className="zoo-empty">
                  {speciesInHabitat(g.habitat).length === 0
                    ? 'coming soon'
                    : 'none yet — keep tracking'}
                </p>
              ) : (
                <div className="zoo-grid">
                  {g.items.map((v) => {
                    const active = inParty(v)
                    return (
                      <div className="zoo-cell" key={v.seed}>
                        <button
                          type="button"
                          className={`zoo-card${active ? ' zoo-card--in' : ''}`}
                          style={{ borderColor: active ? RARITY_COLOR[v.rarity] : undefined }}
                          title={`${RARITY_LABEL[v.rarity]}${v.shiny ? ' · shiny' : ''}${
                            active ? ' · in party' : partyFull ? ' · party full' : ' · add to party'
                          }`}
                          onClick={() => toggleParty(v)}
                          disabled={!active && partyFull}
                        >
                          <VariantSprite variant={v} size={40} />
                          <i
                            className="zoo-card-dot"
                            style={{ background: RARITY_COLOR[v.rarity] }}
                          />
                          {v.shiny && <span className="zoo-card-shiny">✦</span>}
                        </button>
                        <button
                          type="button"
                          className="zoo-copy"
                          title="copy trade code"
                          onClick={() => copyCode(v)}
                        >
                          {copied === v.seed ? '✓' : '⧉'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ))}
        </div>

        <div className="zoo-trade">
          {showTrade ? (
            <>
              <input
                className="input"
                placeholder="paste a friend's critter code"
                value={importText}
                spellCheck={false}
                autoFocus
                onChange={(e) => {
                  setImportText(e.target.value)
                  setImportMsg(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') importCode()
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={importCode}
                disabled={!importText.trim()}
              >
                import
              </button>
              <button
                type="button"
                className="btn--icon"
                aria-label="close trade"
                onClick={() => {
                  setShowTrade(false)
                  setImportText('')
                  setImportMsg(null)
                }}
              >
                ✕
              </button>
            </>
          ) : (
            <button type="button" className="zoo-trade-toggle" onClick={() => setShowTrade(true)}>
              ＋ add a friend&apos;s critter code
            </button>
          )}
          {importMsg && <span className="zoo-trade-msg">{importMsg}</span>}
        </div>
      </div>
    </div>
  )
}

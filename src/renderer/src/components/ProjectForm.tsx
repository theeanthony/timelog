import { useState } from 'react'
import { PALETTE } from '../../../shared/palette'
import type { Project } from '../../../shared/types'

interface Props {
  existing: Project[]
  onAdded: () => void
  onClose?: () => void
  autoFocus?: boolean
}

export function nextUnusedColor(existing: Project[]): string {
  const used = new Set(existing.map((p) => p.color))
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[existing.length % PALETTE.length]
}

export function ProjectForm({ existing, onAdded, onClose, autoFocus }: Props): React.JSX.Element {
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(() => nextUnusedColor(existing))
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmedCode = code.trim()
    const trimmedLabel = label.trim() || trimmedCode
    if (!trimmedCode) return
    if (existing.some((p) => p.code === trimmedCode)) {
      setError('that charge code already exists')
      return
    }
    await window.timelog.addProject({ code: trimmedCode, label: trimmedLabel, color })
    setCode('')
    setLabel('')
    setError(null)
    onAdded()
  }

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="form-row">
        <input
          className="input input--code"
          placeholder="charge code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus={autoFocus}
          spellCheck={false}
        />
        <input
          className="input"
          placeholder="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          spellCheck={false}
        />
      </div>
      <div className="form-row form-row--bottom">
        <div className="color-picker" role="radiogroup" aria-label="project color">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              className={`color-swatch${color === c ? ' color-swatch--selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="form-actions">
          {onClose && (
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              done
            </button>
          )}
          <button type="submit" className="btn" disabled={!code.trim()}>
            add
          </button>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
    </form>
  )
}

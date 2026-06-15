import { useState } from 'react'
import { PALETTE } from '../../../shared/palette'
import type { Project } from '../../../shared/types'

interface Props {
  existing: Project[]
  onAdded: () => void
  onClose?: () => void
  autoFocus?: boolean
  /** When set, the form edits this project instead of creating a new one. */
  project?: Project
}

function nextUnusedColor(existing: Project[]): string {
  const used = new Set(existing.map((p) => p.color))
  return PALETTE.find((c) => !used.has(c)) ?? PALETTE[existing.length % PALETTE.length]
}

export function ProjectForm({
  existing,
  onAdded,
  onClose,
  autoFocus,
  project
}: Props): React.JSX.Element {
  const editing = !!project
  const [code, setCode] = useState(project?.code ?? '')
  const [label, setLabel] = useState(project?.label ?? '')
  const [color, setColor] = useState(() => project?.color ?? nextUnusedColor(existing))
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const trimmedCode = code.trim()
    const trimmedLabel = label.trim() || trimmedCode
    if (!trimmedCode) return

    if (editing) {
      if (trimmedCode !== project.code) {
        const result = await window.timelog.renameProject(project.code, trimmedCode)
        if ('error' in result) {
          setError(result.error)
          return
        }
      }
      await window.timelog.updateProject(trimmedCode, { label: trimmedLabel, color })
      setError(null)
      onAdded()
      onClose?.()
      return
    }

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

  const del = async (): Promise<void> => {
    if (!project) return
    // Non-destructive default: archive keeps the project's logged time.
    await window.timelog.archiveProject(project.code, true)
    onAdded()
    onClose?.()
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
          aria-label="charge code"
        />
        <input
          className="input"
          placeholder="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          spellCheck={false}
          aria-label="label"
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
              aria-label={`color ${c}`}
              className={`color-swatch${color === c ? ' color-swatch--selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <div className="form-actions">
          {editing && (
            <button type="button" className="btn btn--ghost btn--danger" onClick={del}>
              archive
            </button>
          )}
          {onClose && (
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {editing ? 'cancel' : 'done'}
            </button>
          )}
          <button type="submit" className="btn" disabled={!code.trim()}>
            {editing ? 'save' : 'add'}
          </button>
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
    </form>
  )
}

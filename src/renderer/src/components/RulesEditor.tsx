import { useCallback, useEffect, useState } from 'react'
import type { Project, Rule } from '../../../shared/types'

interface Props {
  projects: Project[]
  onClose: () => void
}

/**
 * Makes auto-mode matching visible and editable: view every window-title rule,
 * toggle/edit/delete it, or add a new one. Changes reload the live tracker.
 */
export function RulesEditor({ projects, onClose }: Props): React.JSX.Element {
  const [rules, setRules] = useState<Rule[]>([])
  const [newCode, setNewCode] = useState(projects[0]?.code ?? '')
  const [newPattern, setNewPattern] = useState('')

  const refresh = useCallback((): void => {
    void window.timelog.listRules().then(setRules)
  }, [])
  useEffect(refresh, [refresh])

  const colorByCode = Object.fromEntries(projects.map((p) => [p.code, p.color]))

  const add = async (): Promise<void> => {
    const pattern = newPattern.trim()
    if (!pattern || !newCode) return
    await window.timelog.addRule(newCode, pattern)
    setNewPattern('')
    refresh()
  }

  const toggle = async (r: Rule): Promise<void> => {
    await window.timelog.updateRule(r.id, { enabled: !r.enabled })
    refresh()
  }

  const editPattern = async (r: Rule, pattern: string): Promise<void> => {
    if (pattern.trim() && pattern !== r.pattern) {
      await window.timelog.updateRule(r.id, { pattern: pattern.trim() })
      refresh()
    }
  }

  const remove = async (r: Rule): Promise<void> => {
    await window.timelog.deleteRule(r.id)
    refresh()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet sheet--rules"
        role="dialog"
        aria-label="window match rules"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <span className="sheet-title">window match rules</span>
          <button type="button" className="btn--icon" aria-label="close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sheet-rows">
          {rules.length === 0 && <div className="sheet-empty">no rules yet</div>}
          {rules.map((r) => (
            <div key={r.id} className={`rule-row${r.enabled ? '' : ' rule-row--off'}`}>
              <span
                className="project-dot"
                style={{ background: colorByCode[r.projectCode] ?? '#5a5766' }}
                title={r.projectCode}
              />
              <span className="project-code">{r.projectCode}</span>
              <input
                className="input rule-pattern"
                defaultValue={r.pattern}
                spellCheck={false}
                onBlur={(e) => void editPattern(r, e.target.value)}
                aria-label={`pattern for ${r.projectCode}`}
              />
              <button
                type="button"
                className="rule-toggle"
                onClick={() => void toggle(r)}
                title={r.enabled ? 'enabled — click to disable' : 'disabled — click to enable'}
              >
                {r.enabled ? 'on' : 'off'}
              </button>
              <button
                type="button"
                className="btn--icon rule-del"
                aria-label="delete rule"
                onClick={() => void remove(r)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="rule-add">
          <select
            className="input input--select"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            aria-label="project for new rule"
          >
            {projects.map((p) => (
              <option key={p.code} value={p.code}>
                {p.code}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="title pattern (regex)"
            value={newPattern}
            spellCheck={false}
            onChange={(e) => setNewPattern(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void add()
            }}
          />
          <button type="button" className="btn" onClick={add} disabled={!newPattern.trim()}>
            add
          </button>
        </div>
      </div>
    </div>
  )
}

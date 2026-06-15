import { useEffect, useState } from 'react'
import type { AppInfo, Prefs } from '../../../shared/types'
import { Row, Toggle } from './SettingsControls'
import { Appearance } from './Appearance'

interface Props {
  prefs: Prefs
  update: (patch: Partial<Prefs>) => Promise<void>
  onOpenRules: () => void
  onClose: () => void
}

export function Settings({ prefs, update, onOpenRules, onClose }: Props): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [shortcut, setShortcut] = useState(prefs.globalShortcut)

  useEffect(() => {
    void window.timelog.getAppInfo().then(setInfo)
  }, [])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet sheet--settings"
        role="dialog"
        aria-label="settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <span className="sheet-title">settings</span>
          <button type="button" className="btn--icon" aria-label="close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="set-body">
          <h2 className="set-group">tracking</h2>
          <Row label="idle timeout" hint="minutes before the timer pauses">
            <input
              className="input input--num"
              type="number"
              min={1}
              value={Math.round(prefs.idleTimeoutSec / 60)}
              onChange={(e) =>
                void update({ idleTimeoutSec: Math.max(1, Number(e.target.value)) * 60 })
              }
            />
          </Row>
          <Row label="auto dwell" hint="seconds before an auto switch commits">
            <input
              className="input input--num"
              type="number"
              min={0}
              value={prefs.dwellSec}
              onChange={(e) => void update({ dwellSec: Math.max(0, Number(e.target.value)) })}
            />
          </Row>
          <Row label="window match rules">
            <button type="button" className="btn" onClick={onOpenRules}>
              edit rules
            </button>
          </Row>

          <h2 className="set-group">window</h2>
          <Row label="launch at login">
            <Toggle
              label="launch at login"
              checked={prefs.launchAtLogin}
              onChange={(v) => void update({ launchAtLogin: v })}
            />
          </Row>
          <Row label="always on top">
            <Toggle
              label="always on top"
              checked={prefs.alwaysOnTop}
              onChange={(v) => void update({ alwaysOnTop: v })}
            />
          </Row>
          <Row label="show / hide shortcut" hint="global hotkey">
            <input
              className="input"
              value={shortcut}
              spellCheck={false}
              onChange={(e) => setShortcut(e.target.value)}
              onBlur={() => {
                if (shortcut !== prefs.globalShortcut) void update({ globalShortcut: shortcut })
              }}
            />
          </Row>

          <Appearance prefs={prefs} update={update} />

          <h2 className="set-group">notifications</h2>
          <Row label="idle pause">
            <Toggle
              label="notify on idle"
              checked={prefs.notifyIdle}
              onChange={(v) => void update({ notifyIdle: v })}
            />
          </Row>
          <Row label="long-running session" hint={`after ${prefs.longRunHours}h`}>
            <Toggle
              label="notify on long run"
              checked={prefs.notifyLongRun}
              onChange={(v) => void update({ notifyLongRun: v })}
            />
          </Row>
          {prefs.notifyLongRun && (
            <Row label="long-run threshold" hint="hours">
              <input
                className="input input--num"
                type="number"
                min={1}
                value={prefs.longRunHours}
                onChange={(e) => void update({ longRunHours: Math.max(1, Number(e.target.value)) })}
              />
            </Row>
          )}
          <Row label="daily summary">
            <Toggle
              label="daily summary"
              checked={prefs.notifyDailySummary}
              onChange={(v) => void update({ notifyDailySummary: v })}
            />
          </Row>
          {prefs.notifyDailySummary && (
            <Row label="summary hour" hint="0–23">
              <input
                className="input input--num"
                type="number"
                min={0}
                max={23}
                value={prefs.dailySummaryHour}
                onChange={(e) =>
                  void update({
                    dailySummaryHour: Math.min(23, Math.max(0, Number(e.target.value)))
                  })
                }
              />
            </Row>
          )}
        </div>

        <div className="sheet-actions">
          <span className="export-note">timelog {info?.version ? `v${info.version}` : ''}</span>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            done
          </button>
        </div>
      </div>
    </div>
  )
}

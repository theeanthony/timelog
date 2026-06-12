import type { TrackerMode } from '../../../shared/types'

interface Props {
  mode: TrackerMode
}

export function Titlebar({ mode }: Props): React.JSX.Element {
  return (
    <header className="titlebar">
      <span className="titlebar-dots" aria-hidden>
        <i />
        <i />
        <i />
      </span>
      <span className="titlebar-name">timelog</span>
      <span className={`mode-badge mode-badge--${mode}`}>
        {mode === 'manual' ? 'MANUAL' : 'AUTO'}
      </span>
    </header>
  )
}

interface Props {
  onAddProject: () => void
  onTimeline: () => void
  onExport: () => void
  exportNote: string | null
}

export function BottomBar({
  onAddProject,
  onTimeline,
  onExport,
  exportNote
}: Props): React.JSX.Element {
  return (
    <footer className="bottom-bar">
      <button type="button" className="btn btn--bar" onClick={onAddProject}>
        + add
      </button>
      <span className="export-note">{exportNote}</span>
      <button
        type="button"
        className="btn btn--bar"
        onClick={onTimeline}
        title="Today's timeline (edit / log time)"
      >
        today ▤
      </button>
      <button type="button" className="btn btn--bar" onClick={onExport} title="Export (⌘E)">
        report ▦
      </button>
    </footer>
  )
}

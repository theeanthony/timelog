interface Props {
  onAddProject: () => void
  onExport: () => void
  exportNote: string | null
}

export function BottomBar({ onAddProject, onExport, exportNote }: Props): React.JSX.Element {
  return (
    <footer className="bottom-bar">
      <button type="button" className="btn btn--bar" onClick={onAddProject}>
        + add project
      </button>
      <span className="export-note">{exportNote}</span>
      <button type="button" className="btn btn--bar" onClick={onExport}>
        week ▦
      </button>
    </footer>
  )
}

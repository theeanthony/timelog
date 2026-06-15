import type { Toast } from '../hooks/useToasts'

interface Props {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function Toasts({ toasts, onDismiss }: Props): React.JSX.Element {
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span className="toast-msg">{t.message}</span>
          {t.undo && (
            <button
              type="button"
              className="toast-undo"
              onClick={() => {
                t.undo?.()
                onDismiss(t.id)
              }}
            >
              undo
            </button>
          )}
          <button
            type="button"
            className="toast-close"
            aria-label="dismiss"
            onClick={() => onDismiss(t.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

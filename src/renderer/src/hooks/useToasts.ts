import { useCallback, useRef, useState } from 'react'

export interface Toast {
  id: number
  message: string
  undo?: () => void
}

/** Transient toasts with an optional undo action (used for destructive ops). */
export function useToasts(): {
  toasts: Toast[]
  push: (message: string, undo?: () => void) => void
  dismiss: (id: number) => void
} {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number): void => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, undo?: () => void): void => {
      const id = ++seq.current
      setToasts((ts) => [...ts, { id, message, undo }])
      setTimeout(() => dismiss(id), 6000)
    },
    [dismiss]
  )

  return { toasts, push, dismiss }
}

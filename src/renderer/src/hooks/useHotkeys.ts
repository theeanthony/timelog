import { useEffect } from 'react'

export interface HotkeyHandlers {
  onToggle?: () => void
  onSwitchIndex?: (index: number) => void
  onQuickSwitch?: () => void
  onExport?: () => void
  onSettings?: () => void
  onAdd?: () => void
  onEscape?: () => void
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

/**
 * Global keyboard shortcuts for the panel. Typing in a field suppresses all
 * keys except Escape, so shortcuts never fight with form input.
 */
export function useHotkeys(handlers: HotkeyHandlers): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handlers.onEscape?.()
        return
      }
      if (isTyping(e.target)) return
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        handlers.onQuickSwitch?.()
      } else if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        handlers.onExport?.()
      } else if (mod && e.key === ',') {
        e.preventDefault()
        handlers.onSettings?.()
      } else if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        handlers.onAdd?.()
      } else if (!mod && e.key === ' ') {
        e.preventDefault()
        handlers.onToggle?.()
      } else if (!mod && /^[1-9]$/.test(e.key)) {
        e.preventDefault()
        handlers.onSwitchIndex?.(Number(e.key) - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handlers])
}

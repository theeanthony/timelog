import type { TimelogApi } from '../shared/ipc-contract'

declare global {
  interface Window {
    timelog: TimelogApi
    timelogEvents: {
      onOpenExportDialog(cb: () => void): () => void
      onOpenSettings(cb: () => void): () => void
    }
  }
}

export {}

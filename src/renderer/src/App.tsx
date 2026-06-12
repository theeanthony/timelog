import { useEffect, useState } from 'react'
import type { TrackerState } from '../../shared/types'

// M1 dev overlay: raw tracker state. Replaced by the floating panel UI in M2.
function App(): React.JSX.Element {
  const [state, setState] = useState<TrackerState | null>(null)

  useEffect(() => {
    window.timelog.getState().then(setState)
    return window.timelog.onState(setState)
  }, [])

  return (
    <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 11, userSelect: 'text' }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>timelog — dev state</div>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {state ? JSON.stringify(state, null, 2) : 'waiting for first tick…'}
      </pre>
    </div>
  )
}

export default App

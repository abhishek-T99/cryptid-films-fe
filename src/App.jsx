import { useEffect, useState } from 'react'

import { getHealth } from '@/lib/api'
import './App.css'

/**
 * Placeholder landing view. It exists to prove the frontend reaches the
 * backend — replace it with the real site once routing and pages land.
 */
export default function App() {
  const [status, setStatus] = useState('checking')

  useEffect(() => {
    const controller = new AbortController()

    getHealth({ signal: controller.signal })
      .then((data) => setStatus(data.status === 'ok' ? 'connected' : 'degraded'))
      .catch((error) => {
        if (error.name !== 'AbortError') setStatus('unreachable')
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="app">
      <h1 className="app__title">Cryptid Films</h1>
      <p className="app__tagline">Features, shorts and documentaries.</p>

      <p className={`app__status app__status--${status}`}>
        <span className="app__dot" aria-hidden="true" />
        {
          {
            checking: 'Contacting the API…',
            connected: 'API connected',
            degraded: 'API reachable, database unhealthy',
            unreachable: 'API unreachable — is the Django server running?',
          }[status]
        }
      </p>
    </main>
  )
}

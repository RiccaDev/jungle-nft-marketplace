import '@fontsource-variable/roboto-mono'
import './styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

async function enableMocking() {
  // Statically replaced by Vite, so the mocks chunk is dropped when disabled.
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  const { startMockWorker } = await import('./mocks/browser')
  await startMockWorker()
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

await enableMocking()

// Imported only after the mocks start: engine.io-client captures `globalThis.WebSocket`
// when its module is evaluated, before MSW would otherwise have patched it.
const { App } = await import('./app/app')

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

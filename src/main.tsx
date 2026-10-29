import '@fontsource-variable/roboto-mono'
import './styles/globals.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/app'

async function enableMocking() {
  // Statically replaced by Vite, so the mocks chunk is dropped when disabled.
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true') return

  const { startMockWorker } = await import('./mocks/browser')
  await startMockWorker()
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found')

await enableMocking()

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

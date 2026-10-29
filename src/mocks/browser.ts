import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export function startMockWorker() {
  return worker.start({
    serviceWorker: {
      // Respects Vite's `base`, so the worker also resolves in sub-path deploys.
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  })
}

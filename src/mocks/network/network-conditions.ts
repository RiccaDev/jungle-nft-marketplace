import { delay, HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/http/api-error'

export type NetworkCondition = {
  delayMs?: number
  status?: number
}

export type NetworkConditionResolver = (request: Request) => NetworkCondition | undefined

declare global {
  interface Window {
    // Test/demo hook read on every mocked request; set it from DevTools or Playwright.
    __KURIO_NETWORK_CONDITIONS__?: NetworkConditionResolver
  }
}

const DEFAULT_LATENCY_MS = 250

function errorResponse(status: number): Response {
  return HttpResponse.json<ApiErrorBody>(
    { error: { code: 'SIMULATED_FAILURE', message: `Falha simulada (HTTP ${status}).` } },
    { status },
  )
}

// Returns a response only when the simulated condition replaces the real handler result.
export async function applyNetworkConditions(request: Request) {
  const condition = window.__KURIO_NETWORK_CONDITIONS__?.(request) ?? {}
  await delay(condition.delayMs ?? DEFAULT_LATENCY_MS)

  if (condition.status !== undefined && condition.status >= 400) {
    return errorResponse(condition.status)
  }
  return undefined
}

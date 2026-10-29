import { delay, HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/http/api-error'

export type NetworkCondition = {
  delayMs?: number
  status?: number
  // Applied after the handler committed its changes: the operation succeeds on the server,
  // but the response arrives late (or after the client timeout).
  delayAfterCommitMs?: number
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

// Resolved once per request, so stateful resolvers (counters in tests) see each request once.
export function readNetworkCondition(request: Request): NetworkCondition {
  return window.__KURIO_NETWORK_CONDITIONS__?.(request) ?? {}
}

// Returns a response only when the simulated condition replaces the real handler result.
export async function applyNetworkCondition(condition: NetworkCondition) {
  await delay(condition.delayMs ?? DEFAULT_LATENCY_MS)

  if (condition.status !== undefined && condition.status >= 400) {
    return errorResponse(condition.status)
  }
  return undefined
}

export function applyNetworkConditions(request: Request) {
  return applyNetworkCondition(readNetworkCondition(request))
}

export async function applyDelayAfterCommit(condition: NetworkCondition) {
  if (condition.delayAfterCommitMs) await delay(condition.delayAfterCommitMs)
}

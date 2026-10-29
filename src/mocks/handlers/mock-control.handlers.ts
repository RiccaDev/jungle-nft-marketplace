import { http, HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { readBearerToken } from '../auth/request-session'
import { settleOrder } from '../orders/settle-order'
import { publishNftUpdate, replayNftUpdate } from '../realtime/nft-update-events'
import { interruptRealtimeConnections, resumeRealtimeConnections } from '../realtime/socket-io-server'
import { expireSession } from '../state/auth.state'
import { clearMockStorage } from '../state/mock-storage'
import { applyNextMarketChange } from '../state/nft-catalog.state'
import { findOrder } from '../state/order.state'
import { getMockScenario, updateMockScenario } from '../state/scenario.state'

function notFoundResponse(code: string, message: string) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message } }, { status: 404 })
}

// Mock-only endpoints that drive simulated server-side changes; they never return the new
// data, so the interface can only learn about it through REST refetches or Socket.IO events.
export const mockControlHandlers = [
  http.post<{ nftId: string }>(apiUrl('/__mocks__/nfts/:nftId/market-change'), ({ params }) => {
    const updatedRecord = applyNextMarketChange(params.nftId)
    if (!updatedRecord) return notFoundResponse('NFT_NOT_FOUND', 'NFT não encontrado.')
    publishNftUpdate(updatedRecord)
    return new HttpResponse(null, { status: 202 })
  }),

  http.post<{ nftId: string; version: string }>(
    apiUrl('/__mocks__/nfts/:nftId/events/:version/replay'),
    ({ params }) => {
      const replayedEvent = replayNftUpdate(params.nftId, Number(params.version))
      if (!replayedEvent) return notFoundResponse('EVENT_NOT_FOUND', 'Evento não encontrado.')
      return new HttpResponse(null, { status: 202 })
    },
  ),

  // Expires the session identified by the Bearer token, simulating its TTL running out.
  http.post(apiUrl('/__mocks__/auth/expire-session'), ({ request }) => {
    const token = readBearerToken(request)
    if (!token || !expireSession(token)) return notFoundResponse('SESSION_NOT_FOUND', 'Sessão não encontrada.')
    return new HttpResponse(null, { status: 202 })
  }),

  // Wallet and payment outcomes (see MockScenario); persisted, so they survive a refresh.
  http.get(apiUrl('/__mocks__/scenario'), () => HttpResponse.json(getMockScenario())),

  http.put(apiUrl('/__mocks__/scenario'), async ({ request }) => {
    const changes = (await request.json().catch(() => ({}))) as Record<string, unknown>
    return HttpResponse.json(updateMockScenario(changes))
  }),

  // Settles a pending order now (used with the "manual" payment scenario).
  http.post<{ orderId: string }>(apiUrl('/__mocks__/orders/:orderId/settle'), async ({ request, params }) => {
    const { outcome } = (await request.json().catch(() => ({}))) as { outcome?: string }
    if (outcome !== 'confirmed' && outcome !== 'rejected') {
      return HttpResponse.json<ApiErrorBody>(
        { error: { code: 'VALIDATION_FAILED', message: 'Use outcome "confirmed" ou "rejected".' } },
        { status: 422 },
      )
    }
    if (!findOrder(params.orderId)) return notFoundResponse('ORDER_NOT_FOUND', 'Pedido não encontrado.')
    if (!settleOrder(params.orderId, outcome)) {
      return HttpResponse.json<ApiErrorBody>(
        { error: { code: 'ORDER_ALREADY_SETTLED', message: 'O pedido já está em um estado final.' } },
        { status: 409 },
      )
    }
    return new HttpResponse(null, { status: 202 })
  }),

  // Drops every Socket.IO connection and refuses new ones until resumed.
  http.post(apiUrl('/__mocks__/realtime/interrupt'), () => {
    interruptRealtimeConnections()
    return new HttpResponse(null, { status: 202 })
  }),

  http.post(apiUrl('/__mocks__/realtime/resume'), () => {
    resumeRealtimeConnections()
    return new HttpResponse(null, { status: 202 })
  }),

  // Drops all persisted mock state; reload the page afterwards to start from the fixtures.
  http.post(apiUrl('/__mocks__/reset'), () => {
    clearMockStorage()
    return new HttpResponse(null, { status: 202 })
  }),
]

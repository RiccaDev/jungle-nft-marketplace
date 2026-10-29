import { http, HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { publishNftUpdate, replayNftUpdate } from '../realtime/nft-update-events'
import { applyNextMarketChange } from '../state/nft-catalog.state'

// Mock-only endpoints that drive simulated server-side changes; they never return the new
// data, so the interface can only learn about it through REST refetches or Socket.IO events.
export const mockControlHandlers = [
  http.post<{ nftId: string }>(apiUrl('/__mocks__/nfts/:nftId/market-change'), ({ params }) => {
    const updatedRecord = applyNextMarketChange(params.nftId)
    if (!updatedRecord) {
      return HttpResponse.json<ApiErrorBody>(
        { error: { code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' } },
        { status: 404 },
      )
    }
    publishNftUpdate(updatedRecord)
    return new HttpResponse(null, { status: 202 })
  }),

  http.post<{ nftId: string; version: string }>(
    apiUrl('/__mocks__/nfts/:nftId/events/:version/replay'),
    ({ params }) => {
      const replayedEvent = replayNftUpdate(params.nftId, Number(params.version))
      if (!replayedEvent) {
        return HttpResponse.json<ApiErrorBody>(
          { error: { code: 'EVENT_NOT_FOUND', message: 'Evento não encontrado.' } },
          { status: 404 },
        )
      }
      return new HttpResponse(null, { status: 202 })
    },
  ),
]

import { http, HttpResponse } from 'msw'
import type { DemoNft } from '@/features/realtime-demo/demo-nft.api'
import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import { apiUrl } from '@/lib/http/config'
import { emitToConnectedClients } from '../realtime/socket-io-server'
import { applyNextMarketChange, getDemoNft } from '../state/demo-nft.state'

function toNftUpdatedEvent(nft: DemoNft): NftUpdatedEvent {
  return {
    eventId: `nft.updated:${nft.id}:${nft.version}`,
    nftId: nft.id,
    version: nft.version,
    priceEth: nft.priceEth,
    availableQuantity: nft.availableQuantity,
    occurredAt: new Date().toISOString(),
  }
}

export const demoNftHandlers = [
  http.get(apiUrl('/demo/nft'), () => HttpResponse.json<DemoNft>(getDemoNft())),

  http.post(apiUrl('/__mocks__/nft-updates'), () => {
    const updatedNft = applyNextMarketChange()
    emitToConnectedClients('nft.updated', toNftUpdatedEvent(updatedNft))
    return new HttpResponse(null, { status: 202 })
  }),
]

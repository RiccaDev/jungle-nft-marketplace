import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import type { DemoNft } from './demo-nft.api'

export function isNewerNftEvent(nft: DemoNft, event: NftUpdatedEvent) {
  return nft.id === event.nftId && event.version > nft.version
}

export function applyNftUpdatedEvent(nft: DemoNft, event: NftUpdatedEvent): DemoNft {
  if (!isNewerNftEvent(nft, event)) return nft

  return {
    ...nft,
    priceEth: event.priceEth,
    availableQuantity: event.availableQuantity,
    version: event.version,
  }
}

import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import type { NftDetail, NftSummary } from './nft.contracts'

// Events carry a monotonic version per NFT: duplicates and stale deliveries are no-ops.
export function isNewerNftEvent(nft: Pick<NftSummary, 'id' | 'version'>, event: NftUpdatedEvent) {
  return nft.id === event.nftId && event.version > nft.version
}

export function applyEventToSummary<Nft extends NftSummary>(nft: Nft, event: NftUpdatedEvent): Nft {
  if (!isNewerNftEvent(nft, event)) return nft

  return {
    ...nft,
    priceEth: event.priceEth,
    availableQuantity: event.availableQuantity,
    version: event.version,
  }
}

export function applyEventToDetail(nft: NftDetail, event: NftUpdatedEvent): NftDetail {
  if (!isNewerNftEvent(nft, event)) return nft

  return {
    ...applyEventToSummary(nft, event),
    editions: nft.editions.map((edition) => ({
      ...edition,
      availableQuantity:
        event.editions.find((update) => update.tier === edition.tier)?.availableQuantity ??
        edition.availableQuantity,
    })),
  }
}

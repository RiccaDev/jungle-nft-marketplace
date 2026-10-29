import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import type { NftCatalogRecord } from '../fixtures/nft-catalog.fixtures'
import { emitToConnectedClients } from './socket-io-server'

const emittedEventsByNftId = new Map<string, NftUpdatedEvent[]>()

function toNftUpdatedEvent(record: NftCatalogRecord): NftUpdatedEvent {
  return {
    eventId: `nft.updated:${record.id}:${record.version}`,
    nftId: record.id,
    version: record.version,
    priceEth: record.priceEth,
    availableQuantity: record.availableQuantity,
    editions: record.editions.map(({ tier, availableQuantity }) => ({ tier, availableQuantity })),
    occurredAt: new Date().toISOString(),
  }
}

export function publishNftUpdate(record: NftCatalogRecord) {
  const event = toNftUpdatedEvent(record)
  emittedEventsByNftId.set(record.id, [...(emittedEventsByNftId.get(record.id) ?? []), event])
  emitToConnectedClients('nft.updated', event)
  return event
}

// Re-sends an already published event unchanged, simulating duplicated or late delivery.
export function replayNftUpdate(nftId: string, version: number) {
  const event = emittedEventsByNftId.get(nftId)?.find((candidate) => candidate.version === version)
  if (event) emitToConnectedClients('nft.updated', event)
  return event
}

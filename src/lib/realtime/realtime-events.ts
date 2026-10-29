import type { NftEditionTier } from '@/features/nfts/nft.contracts'

export type NftUpdatedEvent = {
  eventId: string
  nftId: string
  version: number
  priceEth: string
  availableQuantity: number
  editions: {
    tier: NftEditionTier
    availableQuantity: number
  }[]
  occurredAt: string
}

export type ServerToClientEvents = {
  'nft.updated': (event: NftUpdatedEvent) => void
}

export type ClientToServerEvents = Record<string, never>

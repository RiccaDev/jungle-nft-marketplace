import type { NftEditionTier } from '@/features/nfts/nft.contracts'
import type { Order } from '@/features/orders/order.contracts'

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

// Private event: only connections authenticated as the order owner receive it.
export type OrderUpdatedEvent = Pick<Order, 'status' | 'version' | 'updatedAt' | 'transaction' | 'failure'> & {
  eventId: string
  orderId: string
  occurredAt: string
}

export type ServerToClientEvents = {
  'nft.updated': (event: NftUpdatedEvent) => void
  'order.updated': (event: OrderUpdatedEvent) => void
}

export type ClientToServerEvents = Record<string, never>

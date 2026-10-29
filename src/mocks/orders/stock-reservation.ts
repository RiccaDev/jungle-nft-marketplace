import type { OrderLine } from '@/features/orders/order.contracts'
import { publishNftUpdate } from '../realtime/nft-update-events'
import { adjustEditionStock } from '../state/nft-catalog.state'

// Stock leaves the catalog when the order is created (pending), so nobody else can buy it
// while the payment settles; a rejected payment puts it back. Each change emits nft.updated.
function adjustStock(lines: readonly OrderLine[], direction: 1 | -1) {
  for (const line of lines) {
    const updatedRecord = adjustEditionStock(line.nftId, line.editionTier, direction * line.quantity)
    if (updatedRecord) publishNftUpdate(updatedRecord)
  }
}

export function reserveStock(lines: readonly OrderLine[]) {
  adjustStock(lines, -1)
}

export function releaseStock(lines: readonly OrderLine[]) {
  adjustStock(lines, 1)
}

import { useState } from 'react'
import type { NftDetail, NftEditionTier } from '@/features/nfts/nft.contracts'
import {
  findEdition,
  maxSelectableQuantity,
  pickDefaultEditionTier,
} from '@/features/nfts/nft-edition-selection'

type UseNftPurchaseSelectionOptions = {
  nft: NftDetail
  urlEditionTier: NftEditionTier | undefined
  onEditionTierChange: (tier: NftEditionTier) => void
}

export function useNftPurchaseSelection({
  nft,
  urlEditionTier,
  onEditionTierChange,
}: UseNftPurchaseSelectionOptions) {
  // The default is pinned on first render so a realtime stock change never swaps the edition.
  const [defaultEditionTier] = useState(() => pickDefaultEditionTier(nft.editions))
  const [requestedQuantity, setRequestedQuantity] = useState(1)

  const selectedEditionTier = urlEditionTier ?? defaultEditionTier
  const selectedEdition = findEdition(nft.editions, selectedEditionTier)
  const maxQuantity = maxSelectableQuantity(selectedEdition)
  const quantity = Math.min(requestedQuantity, maxQuantity)

  function selectEdition(tier: NftEditionTier) {
    setRequestedQuantity(1)
    onEditionTierChange(tier)
  }

  return {
    selectedEditionTier,
    selectedEdition,
    quantity,
    maxQuantity,
    isEditionSoldOut: maxQuantity === 0,
    // Only a stock drop (never user input) can push the request above the limit.
    wasQuantityReduced: requestedQuantity > maxQuantity && maxQuantity > 0,
    selectEdition,
    increaseQuantity: () => setRequestedQuantity(Math.min(quantity + 1, maxQuantity)),
    decreaseQuantity: () => setRequestedQuantity(Math.max(quantity - 1, 1)),
  }
}

export type NftPurchaseSelectionState = ReturnType<typeof useNftPurchaseSelection>

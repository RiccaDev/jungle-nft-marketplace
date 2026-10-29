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
  getQuantityInCart: (tier: NftEditionTier) => number
}

export function useNftPurchaseSelection({
  nft,
  urlEditionTier,
  onEditionTierChange,
  getQuantityInCart,
}: UseNftPurchaseSelectionOptions) {
  // The default is pinned on first render so a realtime stock change never swaps the edition.
  const [defaultEditionTier] = useState(() => pickDefaultEditionTier(nft.editions))
  const [requestedQuantity, setRequestedQuantity] = useState(1)

  const selectedEditionTier = urlEditionTier ?? defaultEditionTier
  const selectedEdition = findEdition(nft.editions, selectedEditionTier)
  const stockLimit = maxSelectableQuantity(selectedEdition)
  const quantityInCart = selectedEditionTier ? getQuantityInCart(selectedEditionTier) : 0
  // Units already in the cart count towards the per-order limit of the edition.
  const maxQuantity = Math.max(0, stockLimit - quantityInCart)
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
    quantityInCart,
    isEditionSoldOut: stockLimit === 0,
    isCartLimitReached: stockLimit > 0 && maxQuantity === 0,
    // Only a stock drop (never user input or the cart) can push the request above the stock.
    wasQuantityReduced: requestedQuantity > stockLimit && stockLimit > 0,
    selectEdition,
    increaseQuantity: () => setRequestedQuantity(Math.min(quantity + 1, maxQuantity)),
    decreaseQuantity: () => setRequestedQuantity(Math.max(quantity - 1, 1)),
    resetQuantity: () => setRequestedQuantity(1),
  }
}

export type NftPurchaseSelectionState = ReturnType<typeof useNftPurchaseSelection>

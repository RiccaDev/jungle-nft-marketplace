import {
  cartItemId,
  type Cart,
  type CartItem,
} from '@/features/cart/cart.contracts'
import { findEdition } from '@/features/nfts/nft-edition-selection'
import { findNftRecord } from '../state/nft-catalog.state'
import type { StoredCart, StoredCartItem } from '../state/cart.state'

export const EMPTY_CART: Cart = { id: null, version: 0, items: [], couponCode: null }

function toCartItem(item: StoredCartItem): CartItem | undefined {
  const nft = findNftRecord(item.nftId)
  const edition = nft && findEdition(nft.editions, item.editionTier)
  if (!nft || !edition) return undefined

  return {
    id: cartItemId(item.nftId, item.editionTier),
    nftId: item.nftId,
    editionTier: item.editionTier,
    quantity: item.quantity,
    nft: {
      name: nft.name,
      image: nft.image,
      tokenId: nft.tokenId,
      network: nft.network,
      priceEth: nft.priceEth,
      version: nft.version,
      availableQuantity: edition.availableQuantity,
      maxPerOrder: edition.maxPerOrder,
    },
  }
}

// Joins stored lines with the live catalog, the same records used by REST and nft.updated.
export function resolveCart(cart: StoredCart | undefined): Cart {
  if (!cart) return EMPTY_CART
  return {
    id: cart.id,
    version: cart.version,
    items: cart.items.map(toCartItem).filter((item): item is CartItem => item !== undefined),
    couponCode: cart.couponCode,
  }
}

import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import type { Cart, CartItem } from './cart.contracts'

function applyEventToCartItem(item: CartItem, event: NftUpdatedEvent): CartItem {
  if (item.nftId !== event.nftId || event.version <= item.nft.version) return item

  const editionUpdate = event.editions.find((edition) => edition.tier === item.editionTier)
  return {
    ...item,
    nft: {
      ...item.nft,
      priceEth: event.priceEth,
      version: event.version,
      availableQuantity: editionUpdate?.availableQuantity ?? item.nft.availableQuantity,
    },
  }
}

export function applyNftUpdatedToCart(cart: Cart, event: NftUpdatedEvent): Cart {
  if (!cart.items.some((item) => item.nftId === event.nftId)) return cart
  return { ...cart, items: cart.items.map((item) => applyEventToCartItem(item, event)) }
}

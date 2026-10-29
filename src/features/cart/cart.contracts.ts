import type { NftEditionTier, NftImage, NftNetworkId } from '@/features/nfts/nft.contracts'

// Live catalog data for the line, resolved by the API on every read.
export type CartItemNft = {
  name: string
  image: NftImage
  tokenId: string
  network: NftNetworkId
  priceEth: string
  version: number
  availableQuantity: number
  maxPerOrder: number
}

export type CartItem = {
  id: string
  nftId: string
  editionTier: NftEditionTier
  quantity: number
  nft: CartItemNft
}

export type Cart = {
  id: string | null
  version: number
  items: CartItem[]
  couponCode: string | null
}

export type CartItemIssue = 'sold-out' | 'insufficient-stock'

export type CartQuoteLine = {
  itemId: string
  nftVersion: number
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
  issue: CartItemIssue | null
}

export type CartQuote = {
  id: string
  cartVersion: number
  lines: CartQuoteLine[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: { code: string; description: string } | null
  couponIssue: 'expired' | null
  createdAt: string
  expiresAt: string
}

export type AddCartItemRequest = {
  nftId: string
  editionTier: NftEditionTier
  quantity: number
}

export type CartMergeAdjustment = {
  itemId: string
  name: string
  requestedQuantity: number
  quantity: number
}

export type MergeCartResponse = {
  cart: Cart
  mergedItemCount: number
  adjustments: CartMergeAdjustment[]
}

export const CART_ERROR_CODES = {
  quantityLimitExceeded: 'QUANTITY_LIMIT_EXCEEDED',
  editionSoldOut: 'EDITION_SOLD_OUT',
  itemNotFound: 'CART_ITEM_NOT_FOUND',
  couponInvalid: 'COUPON_INVALID',
  couponExpired: 'COUPON_EXPIRED',
} as const

// Visitors are identified by an opaque cart id; authenticated requests use the account cart.
export const GUEST_CART_HEADER = 'X-Guest-Cart-Id'

export function cartItemId(nftId: string, editionTier: NftEditionTier) {
  return `${nftId}:${editionTier}`
}

export function maxCartLineQuantity(nft: Pick<CartItemNft, 'availableQuantity' | 'maxPerOrder'>) {
  return Math.max(0, Math.min(nft.availableQuantity, nft.maxPerOrder))
}

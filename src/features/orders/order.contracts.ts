import type { CartQuote } from '@/features/cart/cart.contracts'
import type { NftEditionTier, NftImage, NftNetworkId } from '@/features/nfts/nft.contracts'
import type { PaymentNetworkId } from '@/features/wallets/wallet.contracts'
import type { ApiErrorBody } from '@/lib/http/api-error'

export type OrderStatus = 'pending' | 'confirmed' | 'rejected'

export type BuyerDetails = {
  fullName: string
  email: string
}

// Snapshot of the line at purchase time: later catalog changes never alter it.
export type OrderLine = {
  itemId: string
  nftId: string
  editionTier: NftEditionTier
  name: string
  image: NftImage
  tokenId: string
  network: NftNetworkId
  quantity: number
  unitPriceEth: string
  lineTotalEth: string
}

export type OrderPricing = {
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
  coupon: { code: string; description: string } | null
}

export type Order = {
  id: string
  number: string
  status: OrderStatus
  version: number
  createdAt: string
  updatedAt: string
  lines: OrderLine[]
  pricing: OrderPricing
  buyer: BuyerDetails
  payment: {
    walletId: string
    walletLabel: string
    address: string
    network: PaymentNetworkId
  }
  // Simulated references, only present once the payment is confirmed.
  transaction: { hash: string; explorerUrl: string } | null
  failure: { code: string; message: string } | null
}

// The values the buyer reviewed and accepted. The API recomputes the quote and refuses the
// order if anything differs, so a stale price can never be charged silently.
export type ExpectedQuote = {
  couponCode: string | null
  lines: { itemId: string; quantity: number; unitPriceEth: string }[]
  subtotalEth: string
  discountEth: string
  networkFeeEth: string
  totalEth: string
}

export type CreateOrderRequest = {
  buyer: BuyerDetails
  walletConnectionId: string
  expectedQuote: ExpectedQuote
}

export type OrderListResponse = { orders: Order[] }

// 409 QUOTE_CHANGED / CART_NOT_PURCHASABLE carry the quote computed by the API.
export type QuoteConflictErrorBody = ApiErrorBody & { currentQuote: CartQuote }
// 409 ORDER_PENDING points to the order that must finish first.
export type PendingOrderErrorBody = ApiErrorBody & { orderId: string }

export const IDEMPOTENCY_KEY_HEADER = 'Idempotency-Key'

export const ORDER_ERROR_CODES = {
  idempotencyKeyRequired: 'IDEMPOTENCY_KEY_REQUIRED',
  idempotencyKeyReused: 'IDEMPOTENCY_KEY_REUSED',
  cartEmpty: 'CART_EMPTY',
  cartNotPurchasable: 'CART_NOT_PURCHASABLE',
  quoteChanged: 'QUOTE_CHANGED',
  orderPending: 'ORDER_PENDING',
  orderNotFound: 'ORDER_NOT_FOUND',
  paymentRejected: 'PAYMENT_REJECTED',
} as const

export function isTerminalOrderStatus(status: OrderStatus) {
  return status !== 'pending'
}

import {
  maxCartLineQuantity,
  type Cart,
  type CartItem,
  type CartQuote,
  type CartQuoteLine,
} from '@/features/cart/cart.contracts'
import { ethToWei, multiplyEth, sumEth, weiToEth } from '@/lib/eth/eth-amount'
import {
  MOCK_COUPONS,
  NETWORK_FEES_ETH,
  QUOTE_TTL_MS,
  type MockCoupon,
} from '../fixtures/cart-pricing.fixtures'

export function findCoupon(code: string) {
  return MOCK_COUPONS.find((coupon) => coupon.code === code.trim().toUpperCase())
}

export function isCouponExpired(coupon: MockCoupon, now: Date) {
  return coupon.expiresAt !== null && new Date(coupon.expiresAt).getTime() < now.getTime()
}

function lineIssue(item: CartItem): CartQuoteLine['issue'] {
  if (item.nft.availableQuantity === 0) return 'sold-out'
  return item.quantity > maxCartLineQuantity(item.nft) ? 'insufficient-stock' : null
}

function toQuoteLine(item: CartItem): CartQuoteLine {
  return {
    itemId: item.id,
    nftVersion: item.nft.version,
    quantity: item.quantity,
    unitPriceEth: item.nft.priceEth,
    lineTotalEth: multiplyEth(item.nft.priceEth, item.quantity),
    issue: lineIssue(item),
  }
}

function discountWei(coupon: MockCoupon, subtotalWei: bigint) {
  const discount =
    coupon.discount.kind === 'percent'
      ? (subtotalWei * BigInt(coupon.discount.percent)) / 100n
      : ethToWei(coupon.discount.amountEth)
  return discount > subtotalWei ? subtotalWei : discount
}

// All amounts are computed in wei (BigInt) from decimal strings; lines with stock issues are
// listed but excluded from the totals until the buyer fixes them.
export function quoteCart(cart: Cart, now: Date): CartQuote {
  const lines = cart.items.map(toQuoteLine)
  const purchasableItems = cart.items.filter((_, index) => lines[index]?.issue === null)
  const subtotalWei = ethToWei(
    sumEth(lines.filter((line) => line.issue === null).map((line) => line.lineTotalEth)),
  )

  const coupon = cart.couponCode ? findCoupon(cart.couponCode) : undefined
  const isCouponUsable = coupon !== undefined && !isCouponExpired(coupon, now)
  const discount = isCouponUsable ? discountWei(coupon, subtotalWei) : 0n

  const networks = [...new Set(purchasableItems.map((item) => item.nft.network))]
  const networkFeeWei = networks.reduce((total, network) => total + ethToWei(NETWORK_FEES_ETH[network]), 0n)

  return {
    id: crypto.randomUUID(),
    cartVersion: cart.version,
    lines,
    subtotalEth: weiToEth(subtotalWei),
    discountEth: weiToEth(discount),
    networkFeeEth: weiToEth(networkFeeWei),
    totalEth: weiToEth(subtotalWei - discount + networkFeeWei),
    coupon: coupon ? { code: coupon.code, description: coupon.description } : null,
    couponIssue: coupon && !isCouponUsable ? 'expired' : null,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + QUOTE_TTL_MS).toISOString(),
  }
}

import { cartItemId, type Cart, type CartQuote } from '@/features/cart/cart.contracts'
import { normalizeEmail } from '@/features/auth/auth-validation'
import type { CreateOrderRequest, ExpectedQuote, OrderLine } from '@/features/orders/order.contracts'
import type { WalletConnection } from '@/features/wallets/wallet.contracts'
import { ethToWei, isEthAmount, weiToEth } from '@/lib/eth/eth-amount'
import type { MockScenario } from '../state/scenario.state'
import { nextOrderNumber, type StoredOrder } from '../state/order.state'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isEthString(value: unknown): value is string {
  return typeof value === 'string' && isEthAmount(value)
}

function parseExpectedQuote(value: unknown): ExpectedQuote | null {
  if (!isRecord(value) || !Array.isArray(value.lines)) return null
  const { couponCode, subtotalEth, discountEth, networkFeeEth, totalEth } = value
  if (couponCode !== null && typeof couponCode !== 'string') return null
  if (![subtotalEth, discountEth, networkFeeEth, totalEth].every(isEthString)) return null

  const lines: ExpectedQuote['lines'] = []
  for (const line of value.lines as unknown[]) {
    if (!isRecord(line) || typeof line.itemId !== 'string' || !isEthString(line.unitPriceEth)) return null
    if (typeof line.quantity !== 'number' || !Number.isInteger(line.quantity) || line.quantity <= 0) return null
    lines.push({ itemId: line.itemId, quantity: line.quantity, unitPriceEth: line.unitPriceEth })
  }
  return {
    couponCode,
    lines,
    subtotalEth: subtotalEth as string,
    discountEth: discountEth as string,
    networkFeeEth: networkFeeEth as string,
    totalEth: totalEth as string,
  }
}

export function parseCreateOrderRequest(body: unknown): CreateOrderRequest | null {
  if (!isRecord(body) || !isRecord(body.buyer) || typeof body.walletConnectionId !== 'string') return null
  const { fullName, email } = body.buyer
  if (typeof fullName !== 'string' || typeof email !== 'string') return null
  const expectedQuote = parseExpectedQuote(body.expectedQuote)
  if (!expectedQuote) return null
  return { buyer: { fullName, email }, walletConnectionId: body.walletConnectionId, expectedQuote }
}

const normalizeEth = (value: string) => weiToEth(ethToWei(value))

// Canonical form of the request: equivalent bodies (key order, "1.2" vs "1.20", spacing in the
// name) produce the same fingerprint, so a retry is recognised as the same attempt.
export function fingerprintCreateOrderRequest({ buyer, walletConnectionId, expectedQuote }: CreateOrderRequest) {
  return JSON.stringify([
    buyer.fullName.trim().replace(/\s+/g, ' '),
    normalizeEmail(buyer.email),
    walletConnectionId,
    expectedQuote.couponCode,
    [...expectedQuote.lines]
      .sort((left, right) => left.itemId.localeCompare(right.itemId))
      .map((line) => [line.itemId, line.quantity, normalizeEth(line.unitPriceEth)]),
    normalizeEth(expectedQuote.subtotalEth),
    normalizeEth(expectedQuote.discountEth),
    normalizeEth(expectedQuote.networkFeeEth),
    normalizeEth(expectedQuote.totalEth),
  ])
}

// Snapshot of what is being bought, taken from the quote the API just computed.
function snapshotLines(cart: Cart, quote: CartQuote): OrderLine[] {
  return quote.lines.flatMap((line) => {
    const item = cart.items.find((candidate) => cartItemId(candidate.nftId, candidate.editionTier) === line.itemId)
    if (!item || line.issue !== null) return []
    return [
      {
        itemId: line.itemId,
        nftId: item.nftId,
        editionTier: item.editionTier,
        name: item.nft.name,
        image: item.nft.image,
        tokenId: item.nft.tokenId,
        network: item.nft.network,
        quantity: line.quantity,
        unitPriceEth: line.unitPriceEth,
        lineTotalEth: line.lineTotalEth,
      },
    ]
  })
}

type BuildOrderInput = {
  userId: string
  idempotencyKey: string
  requestFingerprint: string
  request: CreateOrderRequest
  cart: Cart
  quote: CartQuote
  connection: WalletConnection
  scenario: MockScenario
  now: Date
}

export function buildPendingOrder({
  userId,
  idempotencyKey,
  requestFingerprint,
  request,
  cart,
  quote,
  connection,
  scenario,
  now,
}: BuildOrderInput): StoredOrder {
  const plannedOutcome = scenario.payment === 'manual' ? null : scenario.payment === 'confirm' ? 'confirmed' : 'rejected'
  return {
    id: crypto.randomUUID(),
    number: nextOrderNumber(),
    status: 'pending',
    version: 1,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    lines: snapshotLines(cart, quote),
    pricing: {
      subtotalEth: quote.subtotalEth,
      discountEth: quote.discountEth,
      networkFeeEth: quote.networkFeeEth,
      totalEth: quote.totalEth,
      coupon: quote.coupon,
    },
    buyer: { fullName: request.buyer.fullName.trim(), email: normalizeEmail(request.buyer.email) },
    payment: {
      walletId: connection.walletId,
      walletLabel: connection.walletLabel,
      address: connection.address,
      network: connection.network,
    },
    transaction: null,
    failure: null,
    userId,
    idempotencyKey,
    requestFingerprint,
    plannedOutcome,
    settlesAt: plannedOutcome ? new Date(now.getTime() + scenario.settlementDelayMs).toISOString() : null,
  }
}

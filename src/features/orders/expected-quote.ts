import type { CartQuote } from '@/features/cart/cart.contracts'
import { compareEth } from '@/lib/eth/eth-amount'
import type { ExpectedQuote } from './order.contracts'

type AmountField = 'subtotalEth' | 'discountEth' | 'networkFeeEth' | 'totalEth'

export type QuoteChange =
  | { kind: 'line-price'; itemId: string; previousEth: string; currentEth: string }
  | { kind: 'line-quantity'; itemId: string; previous: number; current: number }
  | { kind: 'line-added' | 'line-removed'; itemId: string }
  | { kind: 'coupon'; previous: string | null; current: string | null }
  | { kind: 'amount'; field: AmountField; previousEth: string; currentEth: string }

const AMOUNT_FIELDS: AmountField[] = ['subtotalEth', 'discountEth', 'networkFeeEth', 'totalEth']

// Only purchasable lines are part of what gets charged (lines with stock issues block checkout).
export function toExpectedQuote(quote: CartQuote): ExpectedQuote {
  return {
    couponCode: quote.couponIssue === null ? (quote.coupon?.code ?? null) : null,
    lines: quote.lines
      .filter((line) => line.issue === null)
      .map(({ itemId, quantity, unitPriceEth }) => ({ itemId, quantity, unitPriceEth })),
    subtotalEth: quote.subtotalEth,
    discountEth: quote.discountEth,
    networkFeeEth: quote.networkFeeEth,
    totalEth: quote.totalEth,
  }
}

// Shared by the checkout (to show what changed) and the API (to refuse a stale order).
// ETH values are compared in wei, so "1.20" and "1.2" are the same amount.
export function diffExpectedQuotes(previous: ExpectedQuote, current: ExpectedQuote): QuoteChange[] {
  const changes: QuoteChange[] = []

  for (const line of previous.lines) {
    const currentLine = current.lines.find((candidate) => candidate.itemId === line.itemId)
    if (!currentLine) {
      changes.push({ kind: 'line-removed', itemId: line.itemId })
      continue
    }
    if (compareEth(line.unitPriceEth, currentLine.unitPriceEth) !== 0) {
      changes.push({
        kind: 'line-price',
        itemId: line.itemId,
        previousEth: line.unitPriceEth,
        currentEth: currentLine.unitPriceEth,
      })
    }
    if (line.quantity !== currentLine.quantity) {
      changes.push({ kind: 'line-quantity', itemId: line.itemId, previous: line.quantity, current: currentLine.quantity })
    }
  }
  for (const line of current.lines) {
    if (!previous.lines.some((candidate) => candidate.itemId === line.itemId)) {
      changes.push({ kind: 'line-added', itemId: line.itemId })
    }
  }

  if (previous.couponCode !== current.couponCode) {
    changes.push({ kind: 'coupon', previous: previous.couponCode, current: current.couponCode })
  }
  for (const field of AMOUNT_FIELDS) {
    if (compareEth(previous[field], current[field]) !== 0) {
      changes.push({ kind: 'amount', field, previousEth: previous[field], currentEth: current[field] })
    }
  }
  return changes
}

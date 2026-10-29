import { useState } from 'react'
import type { Cart, CartQuote } from '@/features/cart/cart.contracts'
import { getCheckoutReadiness } from '@/features/cart/checkout-readiness'
import { diffExpectedQuotes, toExpectedQuote } from '@/features/orders/expected-quote'
import type { ExpectedQuote } from '@/features/orders/order.contracts'

// The buyer reviews and accepts a set of values; the live quote keeps following the API (and
// nft.updated). Any difference between them must be accepted explicitly before paying.
export function useAcceptedQuote(cart: Cart, quote: CartQuote | undefined) {
  const readiness = getCheckoutReadiness(cart, quote)
  const liveQuote = readiness.isReady && quote ? toExpectedQuote(quote) : null
  const [acceptedQuote, setAcceptedQuote] = useState<ExpectedQuote | null>(null)

  // The first valid quote is the one shown for review.
  if (acceptedQuote === null && liveQuote !== null) setAcceptedQuote(liveQuote)

  const changes = acceptedQuote && liveQuote ? diffExpectedQuotes(acceptedQuote, liveQuote) : []

  return {
    readiness,
    acceptedQuote,
    changes,
    acceptChanges: () => {
      if (liveQuote) setAcceptedQuote(liveQuote)
    },
  }
}

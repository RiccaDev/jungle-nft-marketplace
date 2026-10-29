import type { Cart, CartItem, CartQuote, CartQuoteLine } from './cart.contracts'

// A quote only counts if it was computed for exactly this cart (version, quantities and the
// NFT versions behind every price); anything else must be re-quoted before checkout.
export function isQuoteCurrent(cart: Cart, quote: CartQuote | undefined): quote is CartQuote {
  if (!quote || quote.cartVersion !== cart.version || quote.lines.length !== cart.items.length) return false
  return cart.items.every((item) => isQuoteLineCurrent(item, findQuoteLine(quote, item)))
}

export function findQuoteLine(quote: CartQuote | undefined, item: CartItem) {
  return quote?.lines.find((line) => line.itemId === item.id)
}

export function isQuoteLineCurrent(item: CartItem, line: CartQuoteLine | undefined) {
  return line !== undefined && line.quantity === item.quantity && line.nftVersion === item.nft.version
}

export function isQuoteExpired(quote: CartQuote, now = Date.now()) {
  return new Date(quote.expiresAt).getTime() <= now
}

export type CheckoutReadiness = { isReady: true } | { isReady: false; reason: string }

// Integration point for the checkout step.
export function getCheckoutReadiness(cart: Cart, quote: CartQuote | undefined): CheckoutReadiness {
  if (cart.items.length === 0) return { isReady: false, reason: 'Adicione NFTs ao carrinho para continuar.' }
  if (!isQuoteCurrent(cart, quote)) return { isReady: false, reason: 'Aguardando uma cotação atualizada.' }
  if (isQuoteExpired(quote)) return { isReady: false, reason: 'A cotação expirou. Atualize-a para continuar.' }
  if (quote.lines.some((line) => line.issue !== null)) {
    return { isReady: false, reason: 'Ajuste os itens indisponíveis antes de continuar.' }
  }
  if (quote.couponIssue === 'expired') {
    return { isReady: false, reason: 'O cupom aplicado expirou. Remova-o para continuar.' }
  }
  return { isReady: true }
}

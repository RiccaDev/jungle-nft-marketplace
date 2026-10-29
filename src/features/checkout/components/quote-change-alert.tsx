import type { Cart } from '@/features/cart/cart.contracts'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'
import type { QuoteChange } from '@/features/orders/expected-quote'
import { formatEth } from '@/lib/eth/eth-amount'

const AMOUNT_LABELS = {
  subtotalEth: 'Subtotal',
  discountEth: 'Desconto',
  networkFeeEth: 'Taxa de rede',
  totalEth: 'Total',
} as const

function lineLabel(cart: Cart, itemId: string) {
  const item = cart.items.find((candidate) => candidate.id === itemId)
  return item ? `${item.nft.name} (${NFT_EDITION_LABELS[item.editionTier]})` : itemId
}

function describeChange(cart: Cart, change: QuoteChange) {
  switch (change.kind) {
    case 'line-price':
      return `${lineLabel(cart, change.itemId)}: preço de ${formatEth(change.previousEth)} para ${formatEth(change.currentEth)}.`
    case 'line-quantity':
      return `${lineLabel(cart, change.itemId)}: quantidade de ${change.previous} para ${change.current}.`
    case 'line-added':
      return `${lineLabel(cart, change.itemId)}: item incluído no pedido.`
    case 'line-removed':
      return `${lineLabel(cart, change.itemId)}: item retirado do pedido.`
    case 'coupon':
      return `Cupom: ${change.previous ?? 'nenhum'} → ${change.current ?? 'nenhum'}.`
    case 'amount':
      return `${AMOUNT_LABELS[change.field]}: ${formatEth(change.previousEth)} → ${formatEth(change.currentEth)}.`
  }
}

type QuoteChangeAlertProps = {
  cart: Cart
  changes: QuoteChange[]
  onAccept: () => void
}

// Shown while the live quote differs from the values the buyer accepted; paying stays blocked
// until the new values are accepted explicitly.
export function QuoteChangeAlert({ cart, changes, onAccept }: QuoteChangeAlertProps) {
  if (changes.length === 0) return null
  return (
    <div role="alert" data-testid="quote-changes" className="flex flex-col gap-3 rounded-md border border-text-coral bg-surface-card px-4 py-3 text-sm">
      <p className="font-bold text-text-coral">Os valores do pedido mudaram desde a sua revisão:</p>
      <ul className="list-disc pl-5">
        {changes.map((change) => {
          const description = describeChange(cart, change)
          return <li key={description}>{description}</li>
        })}
      </ul>
      <button
        type="button"
        onClick={onAccept}
        className="self-start rounded-[5px] bg-primary px-4 py-2 text-[15px] font-bold text-ink hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        Aceitar novos valores
      </button>
    </div>
  )
}

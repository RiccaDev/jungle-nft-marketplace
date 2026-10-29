import { cn } from 'cn'
import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/features/cart/cart.contracts'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'
import type { ExpectedQuote } from '@/features/orders/order.contracts'
import { formatEth, multiplyEth } from '@/lib/eth/eth-amount'

type CheckoutSummaryProps = {
  cart: Cart
  // Values the buyer accepted; null while the first valid quote is loading.
  acceptedQuote: ExpectedQuote | null
  children: ReactNode
}

function SummaryRow({ label, value, testId, emphasis = false }: {
  label: string
  value: string | undefined
  testId: string
  emphasis?: boolean
}) {
  return (
    <div className={cn('flex items-center justify-between gap-4', emphasis ? 'text-base font-bold' : 'text-[15px]')}>
      <dt>{label}</dt>
      <dd data-testid={testId} className={emphasis ? 'text-text-accent' : undefined}>
        {value ?? <Skeleton className="h-4 w-20" />}
      </dd>
    </div>
  )
}

export function CheckoutSummary({ cart, acceptedQuote, children }: CheckoutSummaryProps) {
  return (
    <section aria-labelledby="checkout-summary-title" className="flex flex-col gap-6">
      <h2 id="checkout-summary-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
        Resumo do pedido
      </h2>

      <ul className="flex flex-col gap-4" aria-label="Itens do pedido">
        {(acceptedQuote?.lines ?? []).map((line) => {
          const item = cart.items.find((candidate) => candidate.id === line.itemId)
          if (!item) return null
          return (
            <li key={line.itemId} data-testid="checkout-line" className="flex items-center gap-3">
              <img
                src={item.nft.image.src}
                srcSet={item.nft.image.srcSet}
                sizes="56px"
                alt={item.nft.image.alt}
                width={56}
                height={56}
                loading="lazy"
                className="size-14 shrink-0 rounded-lg object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                <p className="line-clamp-2 font-bold">{item.nft.name}</p>
                <p className="text-text-secondary">
                  {NFT_EDITION_LABELS[item.editionTier]} · {line.quantity} × {formatEth(line.unitPriceEth)}
                </p>
              </div>
              <p className="text-sm font-bold text-text-accent">{formatEth(multiplyEth(line.unitPriceEth, line.quantity))}</p>
            </li>
          )
        })}
        {!acceptedQuote && <Skeleton className="h-14 rounded-lg" />}
      </ul>

      <dl className="flex flex-col gap-3">
        <SummaryRow label="Subtotal" value={acceptedQuote ? formatEth(acceptedQuote.subtotalEth) : undefined} testId="checkout-subtotal" />
        <SummaryRow
          label={acceptedQuote?.couponCode ? `Desconto (${acceptedQuote.couponCode})` : 'Desconto'}
          value={acceptedQuote ? `(-) ${formatEth(acceptedQuote.discountEth)}` : undefined}
          testId="checkout-discount"
        />
        <SummaryRow label="Taxa de rede" value={acceptedQuote ? formatEth(acceptedQuote.networkFeeEth) : undefined} testId="checkout-network-fee" />
        <SummaryRow label="Total" value={acceptedQuote ? formatEth(acceptedQuote.totalEth) : undefined} testId="checkout-total" emphasis />
      </dl>

      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

import type { UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useId } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useSession } from '@/features/auth/use-auth'
import { formatEth } from '@/lib/eth/eth-amount'
import type { Cart, CartQuote } from '../cart.contracts'
import { getCheckoutReadiness, isQuoteCurrent } from '../checkout-readiness'
import { CouponForm } from './coupon-form'

type CartSummaryProps = {
  cart: Cart
  quote: UseQueryResult<CartQuote>
  variant: 'desktop' | 'mobile'
}

const CHECKOUT_UNAVAILABLE_REASON = 'O pagamento será habilitado na próxima etapa.'

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

function CheckoutAction({ cart, quote, variant }: CartSummaryProps) {
  const reasonId = useId()
  const { status } = useSession()
  const buttonClass = cn(
    'flex w-full items-center justify-center bg-primary text-base leading-4 font-bold text-ink',
    variant === 'desktop' ? 'h-10 rounded-[5px]' : 'h-[60px] rounded-[10px]',
  )

  if (status !== 'authenticated') {
    return (
      <Link
        to="/entrar"
        search={{ redirect: '/carrinho' }}
        className={cn(buttonClass, 'hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none')}
      >
        Conectar e finalizar
      </Link>
    )
  }

  const readiness = getCheckoutReadiness(cart, quote.data)
  const canRefreshQuote = !readiness.isReady && !quote.isFetching

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={reasonId}
        onClick={(event) => event.preventDefault()}
        className={cn(buttonClass, 'cursor-not-allowed opacity-60')}
      >
        Conectar e finalizar
      </button>
      <p id={reasonId} data-testid="checkout-readiness" className="text-center text-xs text-text-secondary">
        {readiness.isReady ? CHECKOUT_UNAVAILABLE_REASON : readiness.reason}
      </p>
      {canRefreshQuote && (
        <button type="button" onClick={() => void quote.refetch()} className="text-sm text-text-accent underline">
          Atualizar cotação
        </button>
      )}
    </div>
  )
}

export function CartSummary({ cart, quote, variant }: CartSummaryProps) {
  const currentQuote = quote.data
  const isOutdated = quote.isPlaceholderData || (currentQuote !== undefined && !isQuoteCurrent(cart, currentQuote))

  return (
    <section aria-labelledby="cart-summary-title" className="flex flex-col gap-6">
      {variant === 'desktop' && (
        <h2 id="cart-summary-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
          Resumo da carteira
        </h2>
      )}
      {variant === 'mobile' && (
        <h2 id="cart-summary-title" className="sr-only">
          Resumo do pedido
        </h2>
      )}

      <CouponForm cart={cart} quote={currentQuote} variant={variant} />

      {quote.isError && !currentQuote ? (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p>Não foi possível calcular a cotação.</p>
          <button type="button" onClick={() => void quote.refetch()} className="text-text-accent underline">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div aria-busy={isOutdated} className={cn('flex flex-col gap-3 transition-opacity', isOutdated && 'opacity-60')}>
          <dl className="flex flex-col gap-3">
            <SummaryRow label="Subtotal" value={currentQuote && formatEth(currentQuote.subtotalEth)} testId="quote-subtotal" />
            <SummaryRow
              label={currentQuote?.coupon ? `Desconto (${currentQuote.coupon.code})` : 'Desconto do lançamento'}
              value={currentQuote && `(-) ${formatEth(currentQuote.discountEth)}`}
              testId="quote-discount"
            />
            <SummaryRow label="Taxa de rede" value={currentQuote && formatEth(currentQuote.networkFeeEth)} testId="quote-network-fee" />
            <p className="-mt-2 text-right text-sm text-text-secondary">Taxa estimada</p>
            <SummaryRow label="Total" value={currentQuote && formatEth(currentQuote.totalEth)} testId="quote-total" emphasis />
          </dl>
          <p role="status" className="text-right text-xs text-text-secondary">
            {isOutdated || quote.isFetching ? 'Atualizando cotação…' : ''}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <CheckoutAction cart={cart} quote={quote} variant={variant} />
        <Link to="/" hash="catalogo" className="text-center text-[15px] text-text-secondary hover:text-text-accent">
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}

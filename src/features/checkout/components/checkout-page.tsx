import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useEffect, useId, useRef, useState } from 'react'
import { BackButton } from '@/components/back-button'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { AuthUser } from '@/features/auth/auth.contracts'
import { useAuthForm } from '@/features/auth/use-auth-form'
import type { Cart } from '@/features/cart/cart.contracts'
import { useCart, useCartQuote } from '@/features/cart/use-cart'
import type { BuyerDetails } from '@/features/orders/order.contracts'
import { ordersQueryOptions } from '@/features/orders/orders.api'
import { useWalletConnection } from '@/features/wallets/use-wallet-connection'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { validateBuyerDetails } from '../checkout-validation'
import { useAcceptedQuote } from '../use-accepted-quote'
import { usePlaceOrder, type PlaceOrderFailure } from '../use-place-order'
import { BuyerDetailsForm } from './buyer-details-form'
import { CheckoutReview } from './checkout-review'
import { CheckoutSummary } from './checkout-summary'
import { QuoteChangeAlert } from './quote-change-alert'
import { WalletPanel } from './wallet-panel'

type CheckoutStep = 'details' | 'review'

const PRIMARY_BUTTON_CLASS =
  'flex h-10 w-full items-center justify-center rounded-[5px] bg-primary text-base leading-4 font-bold text-ink hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 max-md:h-[60px] max-md:rounded-[10px]'

function CheckoutHeader({ isDesktop }: { isDesktop: boolean }) {
  if (!isDesktop) {
    return (
      <div className="relative flex h-11 items-center justify-center">
        <div className="absolute left-0">
          <BackButton />
        </div>
        <h1 className="text-xl leading-4 font-bold">Pagamento</h1>
      </div>
    )
  }
  return (
    <>
      <nav aria-label="Trilha de navegação">
        <ol className="flex gap-1 text-[15px] leading-4 font-bold">
          <li>
            <Link to="/" className="hover:text-text-accent">Início</Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li>
            <Link to="/carrinho" className="hover:text-text-accent">Carrinho</Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="text-2xl leading-8 font-bold">Pagamento</h1>
    </>
  )
}

function PlaceOrderFailureAlert({ failure, onRetry, isRetrying }: {
  failure: PlaceOrderFailure
  onRetry: () => void
  isRetrying: boolean
}) {
  return (
    <div role="alert" data-testid="place-order-error" className="flex flex-col items-start gap-2 text-sm text-text-coral">
      <p>{failure.message}</p>
      {failure.kind === 'uncertain' && (
        <button type="button" onClick={onRetry} disabled={isRetrying} className="text-text-accent underline disabled:opacity-60">
          {isRetrying ? 'Reenviando…' : 'Tentar novamente'}
        </button>
      )}
      {failure.kind === 'order-pending' && (
        <Link to="/pedidos/$orderId" params={{ orderId: failure.orderId }} className="text-text-accent underline">
          Acompanhar pedido em andamento
        </Link>
      )}
    </div>
  )
}

function CheckoutFlow({ user, cart, isDesktop }: { user: AuthUser; cart: Cart; isDesktop: boolean }) {
  const formId = useId()
  const blockReasonId = useId()
  const quote = useCartQuote(cart)
  const { readiness, acceptedQuote, changes, acceptChanges } = useAcceptedQuote(cart, quote.data)
  const { connection } = useWalletConnection(user.id)
  const pendingOrders = useQuery(ordersQueryOptions(user.id, 'pending'))
  const pendingOrder = pendingOrders.data?.[0]
  const placeOrder = usePlaceOrder(user.id)
  const [step, setStep] = useState<CheckoutStep>('details')
  const [walletRequirementError, setWalletRequirementError] = useState<string | null>(null)
  const connectButtonRef = useRef<HTMLButtonElement>(null)
  const walletConnection = connection.data ?? null

  const form = useAuthForm<BuyerDetails>({
    initialValues: { fullName: user.displayName, email: user.email },
    validate: validateBuyerDetails,
    onSubmit: async () => {
      if (!walletConnection) {
        setWalletRequirementError('Conecte uma carteira para continuar.')
        connectButtonRef.current?.focus()
        return
      }
      setWalletRequirementError(null)
      setStep('review')
    },
  })

  useEffect(() => {
    if (step === 'review') document.getElementById('checkout-review-title')?.focus()
  }, [step])

  const blockReason = pendingOrder
    ? 'Há um pedido aguardando confirmação.'
    : !readiness.isReady
      ? readiness.reason
      : changes.length > 0
        ? 'Aceite os novos valores para continuar.'
        : !walletConnection
          ? 'Conecte uma carteira para continuar.'
          : null

  function submitOrder() {
    if (blockReason || !acceptedQuote || !walletConnection) return
    placeOrder.placeOrder({
      buyer: form.values,
      walletConnectionId: walletConnection.id,
      expectedQuote: acceptedQuote,
    })
  }

  function handleAcceptChanges() {
    acceptChanges()
    placeOrder.resetFailure()
  }

  return (
    <>
      {pendingOrder && (
        <div role="status" data-testid="pending-order-notice" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/60 bg-surface-card px-4 py-3 text-sm">
          <p>Você tem um pedido aguardando confirmação ({pendingOrder.number}). Aguarde o resultado antes de iniciar outra compra.</p>
          <Link to="/pedidos/$orderId" params={{ orderId: pendingOrder.id }} className="font-bold text-text-accent underline">
            Acompanhar pedido
          </Link>
        </div>
      )}

      <QuoteChangeAlert cart={cart} changes={changes} onAccept={handleAcceptChanges} />

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-[86px]">
        <div className="flex min-w-0 flex-1 flex-col gap-10 lg:max-w-[782px]">
          {step === 'details' ? (
            <>
              <BuyerDetailsForm
                formId={formId}
                values={form.values}
                fieldErrors={form.fieldErrors}
                onFieldChange={form.setFieldValue}
                onSubmit={(event) => void form.handleSubmit(event)}
                registerInput={form.registerInput}
              />
              <WalletPanel
                userId={user.id}
                requirementError={walletConnection ? null : walletRequirementError}
                connectButtonRef={connectButtonRef}
                disabled={placeOrder.isPending}
              />
            </>
          ) : (
            <CheckoutReview
              buyer={form.values}
              connection={walletConnection}
              onEdit={() => setStep('details')}
              disabled={placeOrder.isPending}
            />
          )}
        </div>

        <div
          className={cn(
            'w-full shrink-0 lg:w-[332px]',
            !isDesktop && '-mx-6 w-auto rounded-t-[40px] bg-surface-card px-6 pt-6 pb-8',
          )}
        >
          <CheckoutSummary cart={cart} acceptedQuote={acceptedQuote}>
            {step === 'details' ? (
              <button type="submit" form={formId} className={PRIMARY_BUTTON_CLASS}>
                Revisar pedido
              </button>
            ) : (
              <button
                type="button"
                onClick={submitOrder}
                disabled={placeOrder.isPending || blockReason !== null}
                aria-describedby={blockReason ? blockReasonId : undefined}
                className={PRIMARY_BUTTON_CLASS}
              >
                {placeOrder.isPending ? 'Enviando pedido…' : 'Confirmar compra'}
              </button>
            )}
            <p id={blockReasonId} data-testid="checkout-block-reason" className="text-center text-xs text-text-secondary empty:hidden">
              {step === 'review' ? blockReason : null}
            </p>
            <p role="status" className="sr-only">
              {placeOrder.isPending ? 'Enviando pedido…' : ''}
            </p>
            {placeOrder.failure && (
              <PlaceOrderFailureAlert failure={placeOrder.failure} onRetry={submitOrder} isRetrying={placeOrder.isPending} />
            )}
            {quote.isError && !quote.data && (
              <button type="button" onClick={() => void quote.refetch()} className="text-sm text-text-accent underline">
                Recalcular cotação
              </button>
            )}
            <Link to="/carrinho" className="text-center text-[15px] text-text-secondary hover:text-text-accent">
              Voltar ao carrinho
            </Link>
          </CheckoutSummary>
        </div>
      </div>
    </>
  )
}

function CheckoutSkeleton() {
  return (
    <div aria-hidden="true" data-testid="checkout-skeleton" className="flex flex-col gap-6 lg:flex-row lg:gap-[86px]">
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10" />
        <Skeleton className="h-[86px] rounded-lg" />
      </div>
      <Skeleton className="h-[360px] rounded-lg lg:w-[332px]" />
    </div>
  )
}

export function CheckoutPage({ user }: { user: AuthUser }) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const cart = useCart()

  return (
    <div className="page-container mt-8 flex flex-col gap-6 pb-12">
      <CheckoutHeader isDesktop={isDesktop} />

      {cart.isPending && <CheckoutSkeleton />}

      {cart.isError && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface-card p-8">
          <h2 className="text-lg font-bold">Não foi possível carregar o pedido.</h2>
          <Button onClick={() => void cart.refetch()} disabled={cart.isFetching}>
            {cart.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        </div>
      )}

      {cart.isSuccess && cart.data.items.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface-card p-8">
          <h2 className="text-lg font-bold">Seu carrinho está vazio.</h2>
          <p className="text-sm text-muted-foreground">Adicione NFTs ao carrinho para finalizar uma compra.</p>
          <Button asChild>
            <Link to="/" hash="catalogo">Explorar NFTs</Link>
          </Button>
        </div>
      )}

      {cart.isSuccess && cart.data.items.length > 0 && (
        <CheckoutFlow user={user} cart={cart.data} isDesktop={isDesktop} />
      )}
    </div>
  )
}

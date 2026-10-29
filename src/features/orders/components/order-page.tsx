import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CheckCircle2Icon, Loader2Icon, XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'
import { PAYMENT_NETWORK_LABELS, shortenAddress } from '@/features/wallets/wallet.contracts'
import { formatEth } from '@/lib/eth/eth-amount'
import { hasHttpStatus } from '@/lib/http/api-error'
import { useSocketStatus } from '@/lib/realtime/use-socket-connection'
import type { Order } from '../order.contracts'
import { orderQueryOptions } from '../orders.api'

function formatDateTime(isoDate: string) {
  return new Date(isoDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function OrderStatusBanner({ order }: { order: Order }) {
  const { isConnected } = useSocketStatus()

  if (order.status === 'pending') {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-primary/60 bg-surface-card p-6">
        <p className="flex items-center gap-3 text-xl font-bold">
          <Loader2Icon aria-hidden="true" className="size-6 animate-spin text-text-accent motion-reduce:animate-none" />
          Pedido pendente
        </p>
        <p className="text-sm text-text-secondary">
          Os itens estão reservados e o pagamento aguarda confirmação da carteira na rede. Esta página atualiza sozinha.
        </p>
        {!isConnected && (
          <p data-testid="order-realtime-offline" className="text-sm text-text-coral">
            Conexão em tempo real interrompida. O status será consultado novamente ao reconectar.
          </p>
        )}
      </div>
    )
  }

  if (order.status === 'rejected') {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-text-coral bg-surface-card p-6">
        <p className="flex items-center gap-3 text-xl font-bold">
          <XCircleIcon aria-hidden="true" className="size-6 text-text-coral" />
          Pagamento recusado
        </p>
        <p className="text-sm">{order.failure?.message}</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/carrinho">Voltar ao carrinho</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/pagamento">Tentar novamente</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary bg-surface-card p-6">
      <p className="flex items-center gap-3 text-xl font-bold">
        <CheckCircle2Icon aria-hidden="true" className="size-6 text-text-accent" />
        Pedido confirmado
      </p>
      <p className="text-sm text-text-secondary">Pagamento confirmado na rede. Os NFTs já são seus.</p>
      {order.transaction && (
        <dl className="flex flex-col gap-1 text-sm">
          <dt className="font-bold">Transação (simulada)</dt>
          <dd data-testid="order-transaction-hash" className="font-mono break-all">
            {order.transaction.hash}
          </dd>
          <dd>
            <a
              href={order.transaction.explorerUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-text-accent underline"
            >
              Ver no explorador de blocos (link simulado, abre em nova aba)
            </a>
          </dd>
        </dl>
      )}
    </div>
  )
}

// The receipt always reproduces the snapshot stored in the order, never the live catalog.
function OrderReceipt({ order }: { order: Order }) {
  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-[86px]">
      <section aria-labelledby="order-items-title" className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-[782px]">
        <h2 id="order-items-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
          Itens
        </h2>
        <ul className="flex flex-col gap-4">
          {order.lines.map((line) => (
            <li key={line.itemId} data-testid="order-line" className="flex items-center gap-4">
              <img
                src={line.image.src}
                srcSet={line.image.srcSet}
                sizes="70px"
                alt={line.image.alt}
                width={70}
                height={70}
                loading="lazy"
                className="size-[70px] shrink-0 rounded-lg object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                <p className="font-bold">{line.name}</p>
                <p className="text-text-secondary">
                  Edição {NFT_EDITION_LABELS[line.editionTier]} · ID {line.tokenId}
                </p>
                <p className="text-text-secondary">
                  {line.quantity} × {formatEth(line.unitPriceEth)}
                </p>
              </div>
              <p className="font-bold text-text-accent">{formatEth(line.lineTotalEth)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="order-summary-title" className="flex w-full shrink-0 flex-col gap-4 lg:w-[332px]">
        <h2 id="order-summary-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
          Resumo
        </h2>
        <dl className="flex flex-col gap-3 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt>Subtotal</dt>
            <dd data-testid="order-subtotal">{formatEth(order.pricing.subtotalEth)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>{order.pricing.coupon ? `Desconto (${order.pricing.coupon.code})` : 'Desconto'}</dt>
            <dd data-testid="order-discount">(-) {formatEth(order.pricing.discountEth)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Taxa de rede</dt>
            <dd data-testid="order-network-fee">{formatEth(order.pricing.networkFeeEth)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-base font-bold">
            <dt>Total</dt>
            <dd data-testid="order-total" className="text-text-accent">{formatEth(order.pricing.totalEth)}</dd>
          </div>
        </dl>
        <dl className="flex flex-col gap-1 rounded-lg bg-surface-card p-4 text-sm">
          <dt className="font-bold text-text-accent">Colecionador</dt>
          <dd>{order.buyer.fullName}</dd>
          <dd className="text-text-secondary">{order.buyer.email}</dd>
          <dt className="mt-2 font-bold text-text-accent">Pagamento</dt>
          <dd>
            {order.payment.walletLabel} · <span className="font-mono">{shortenAddress(order.payment.address)}</span>
          </dd>
          <dd className="text-text-secondary">Rede {PAYMENT_NETWORK_LABELS[order.payment.network]}</dd>
        </dl>
      </section>
    </div>
  )
}

export function OrderPage({ userId, orderId }: { userId: string; orderId: string }) {
  const order = useQuery(orderQueryOptions(userId, orderId))

  return (
    <div className="page-container mt-8 flex flex-col gap-6 pb-12">
      <nav aria-label="Trilha de navegação" className="max-md:hidden">
        <ol className="flex gap-1 text-[15px] leading-4 font-bold">
          <li>
            <Link to="/" className="hover:text-text-accent">Início</Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li aria-current="page">Pedido</li>
        </ol>
      </nav>

      {order.isPending && (
        <div aria-hidden="true" data-testid="order-skeleton" className="flex flex-col gap-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-[120px] rounded-lg" />
          <Skeleton className="h-[200px] rounded-lg" />
        </div>
      )}

      {order.isError &&
        (hasHttpStatus(order.error, 404) ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface-card p-8">
            <h1 className="text-2xl font-bold">Pedido não encontrado</h1>
            <p className="text-sm text-muted-foreground">Este pedido não existe ou pertence a outra conta.</p>
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface-card p-8">
            <h1 className="text-2xl font-bold">Não foi possível carregar o pedido.</h1>
            <Button onClick={() => void order.refetch()} disabled={order.isFetching}>
              {order.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
            </Button>
          </div>
        ))}

      {order.isSuccess && (
        <>
          <header className="flex flex-col gap-1">
            <h1 className="text-2xl leading-8 font-bold">Pedido {order.data.number}</h1>
            <p className="text-sm text-text-secondary">Criado em {formatDateTime(order.data.createdAt)}</p>
          </header>
          <div role="status" aria-live="polite" data-testid="order-status" data-status={order.data.status}>
            <OrderStatusBanner order={order.data} />
          </div>
          <OrderReceipt order={order.data} />
        </>
      )}
    </div>
  )
}

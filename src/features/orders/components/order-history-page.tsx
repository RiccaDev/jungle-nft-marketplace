import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CheckCircle2Icon, ClockIcon, XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/eth/eth-amount'
import type { Order, OrderStatus } from '../order.contracts'
import { ordersQueryOptions } from '../orders.api'

// Text and icon together, so the status never depends on color alone.
const STATUS_DISPLAY: Record<OrderStatus, { label: string; icon: typeof ClockIcon; className: string }> = {
  pending: { label: 'Pendente', icon: ClockIcon, className: 'text-text-secondary' },
  confirmed: { label: 'Confirmado', icon: CheckCircle2Icon, className: 'text-text-accent' },
  rejected: { label: 'Recusado', icon: XCircleIcon, className: 'text-text-coral' },
}

function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function itemCount(order: Order) {
  const count = order.lines.reduce((total, line) => total + line.quantity, 0)
  return `${count} ${count === 1 ? 'item' : 'itens'}`
}

function OrderRow({ order }: { order: Order }) {
  const status = STATUS_DISPLAY[order.status]
  const StatusIcon = status.icon

  return (
    <li
      data-testid="order-history-item"
      className="grid grid-cols-2 items-center gap-x-4 gap-y-2 rounded-lg bg-surface-card p-5 text-sm md:grid-cols-[1.2fr_1.3fr_0.7fr_1fr_1fr_auto]"
    >
      <p className="font-bold">{order.number}</p>
      <p className="text-right text-text-secondary md:text-left">{formatDate(order.createdAt)}</p>
      <p>{itemCount(order)}</p>
      <p className="text-right font-bold text-text-accent md:text-left">{formatEth(order.pricing.totalEth)}</p>
      <p className={`flex items-center gap-1.5 font-bold ${status.className}`}>
        <StatusIcon aria-hidden="true" className="size-4" />
        {status.label}
      </p>
      <Link
        to="/pedidos/$orderId"
        params={{ orderId: order.id }}
        className="text-right text-text-accent underline underline-offset-2"
        aria-label={`Ver recibo do pedido ${order.number}`}
      >
        Ver recibo
      </Link>
    </li>
  )
}

export function OrderHistoryPage({ userId }: { userId: string }) {
  const orders = useQuery(ordersQueryOptions(userId, 'all'))

  return (
    <section aria-labelledby="order-history-title" aria-busy={orders.isPending} className="flex flex-col gap-5">
      <h2 id="order-history-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
        Histórico de pedidos
      </h2>

      {orders.isPending && (
        <div aria-hidden="true" data-testid="order-history-skeleton" className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[72px] rounded-lg" />
          ))}
        </div>
      )}

      {orders.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6 text-sm">
          <p>Não foi possível carregar seus pedidos.</p>
          <Button variant="outline" size="sm" onClick={() => void orders.refetch()} disabled={orders.isFetching}>
            {orders.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        </div>
      )}

      {orders.isSuccess && orders.data.length === 0 && (
        <div className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6 text-sm">
          <p>Você ainda não fez pedidos.</p>
          <Button asChild size="sm" className="font-bold text-ink">
            <Link to="/" hash="catalogo">Explorar NFTs</Link>
          </Button>
        </div>
      )}

      {orders.isSuccess && orders.data.length > 0 && (
        <>
          <div aria-hidden="true" className="hidden grid-cols-[1.2fr_1.3fr_0.7fr_1fr_1fr_auto] gap-x-4 px-5 text-xs font-bold text-text-secondary md:grid">
            <span>Pedido</span>
            <span>Data</span>
            <span>Itens</span>
            <span>Total</span>
            <span>Status</span>
            <span className="w-[72px]" />
          </div>
          <ul className="flex flex-col gap-3" aria-label="Pedidos">
            {orders.data.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

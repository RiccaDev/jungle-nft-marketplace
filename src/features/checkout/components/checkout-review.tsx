import type { BuyerDetails } from '@/features/orders/order.contracts'
import { PAYMENT_NETWORK_LABELS, shortenAddress, type WalletConnection } from '@/features/wallets/wallet.contracts'

type CheckoutReviewProps = {
  buyer: BuyerDetails
  connection: WalletConnection | null
  onEdit: () => void
  disabled: boolean
}

export function CheckoutReview({ buyer, connection, onEdit, disabled }: CheckoutReviewProps) {
  return (
    <section aria-labelledby="checkout-review-title" className="flex flex-col gap-5">
      <h2
        id="checkout-review-title"
        tabIndex={-1}
        className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent focus:outline-none"
      >
        3. Revisão do pedido
      </h2>
      <dl className="grid gap-4 text-sm md:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-lg bg-surface-card p-4">
          <dt className="font-bold text-text-accent">Colecionador</dt>
          <dd>{buyer.fullName.trim()}</dd>
          <dd className="text-text-secondary">{buyer.email.trim()}</dd>
        </div>
        <div className="flex flex-col gap-1 rounded-lg bg-surface-card p-4">
          <dt className="font-bold text-text-accent">Pagamento</dt>
          {connection ? (
            <>
              <dd>
                {connection.walletLabel} · <span className="font-mono">{shortenAddress(connection.address)}</span>
              </dd>
              <dd className="text-text-secondary">Rede {PAYMENT_NETWORK_LABELS[connection.network]}</dd>
            </>
          ) : (
            <dd className="text-text-coral">Carteira desconectada. Volte e conecte uma carteira.</dd>
          )}
        </div>
      </dl>
      <p className="text-sm text-text-secondary">
        Ao confirmar, a API valida novamente preço, estoque, cupom e taxas e reserva os itens. O pagamento é concluído pela
        carteira; você acompanha o resultado na página do pedido.
      </p>
      <button
        type="button"
        onClick={onEdit}
        disabled={disabled}
        className="self-start text-[15px] text-text-accent underline underline-offset-2 disabled:opacity-60"
      >
        Editar dados ou carteira
      </button>
    </section>
  )
}

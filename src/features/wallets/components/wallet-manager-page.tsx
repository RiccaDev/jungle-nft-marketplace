import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ordersQueryOptions } from '@/features/orders/orders.api'
import { readApiError } from '@/lib/http/api-error'
import { useCreateWallet, useMakeWalletPrimary, useUpdateWallet } from '../use-wallet-management'
import { MAX_WALLETS_PER_USER, PAYMENT_NETWORK_LABELS, type Wallet } from '../wallet.contracts'
import { walletsQueryOptions } from '../wallets.api'
import { WalletForm } from './wallet-form'

type EditingTarget = { kind: 'new' } | { kind: 'edit'; walletId: string } | null

const EMPTY_WALLET = { label: '', address: '', networks: [] }

function WalletCard({ wallet, isLocked, onEdit, onMakePrimary, isBusy }: {
  wallet: Wallet
  isLocked: boolean
  onEdit: () => void
  onMakePrimary: () => void
  isBusy: boolean
}) {
  const lockReasonId = useId()
  const roleLabel = wallet.role === 'primary' ? 'Principal' : 'Secundária'

  return (
    <li data-testid="wallet-card" className="flex flex-col gap-3 rounded-lg bg-surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-bold">{wallet.label}</p>
        <span className="rounded-full border border-primary/60 px-3 py-0.5 text-xs font-bold text-text-accent">
          {roleLabel}
        </span>
      </div>
      <p className="font-mono text-sm break-all text-text-secondary">{wallet.address}</p>
      <p className="text-sm">Redes: {wallet.networks.map((network) => PAYMENT_NETWORK_LABELS[network]).join(', ')}</p>
      {isLocked && (
        <p id={lockReasonId} className="text-sm text-text-coral">
          Em uso por um pedido pendente: a edição fica bloqueada até a confirmação.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isLocked || isBusy}
          aria-describedby={isLocked ? lockReasonId : undefined}
          aria-label={`Editar ${wallet.label}`}
        >
          Editar
        </Button>
        {wallet.role === 'secondary' && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMakePrimary}
            disabled={isBusy}
            aria-label={`Tornar ${wallet.label} a carteira principal`}
          >
            Tornar principal
          </Button>
        )}
      </div>
    </li>
  )
}

export function WalletManagerPage({ userId }: { userId: string }) {
  const wallets = useQuery(walletsQueryOptions(userId))
  // Wallets paying a pending order are locked here too (the API enforces it with 409).
  const pendingOrders = useQuery(ordersQueryOptions(userId, 'pending'))
  const createWallet = useCreateWallet(userId)
  const updateWallet = useUpdateWallet(userId)
  const makePrimary = useMakeWalletPrimary(userId)
  const [editing, setEditing] = useState<EditingTarget>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const walletList = wallets.data ?? []
  const lockedWalletIds = new Set((pendingOrders.data ?? []).map((order) => order.payment.walletId))
  const canAdd = wallets.isSuccess && walletList.length < MAX_WALLETS_PER_USER
  const makePrimaryError = makePrimary.error ? (readApiError(makePrimary.error)?.message ?? 'Não foi possível alterar a carteira principal.') : null

  function startEditing(target: EditingTarget) {
    setSuccess(null)
    makePrimary.reset()
    setEditing(target)
  }

  function finish(message: string) {
    setEditing(null)
    setSuccess(message)
  }

  return (
    <section aria-labelledby="wallets-title" className="flex max-w-4xl flex-col gap-5">
      <h2 id="wallets-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
        Carteiras
      </h2>
      <p className="text-sm text-text-secondary">
        Cadastre uma carteira principal e, se quiser, uma secundária. A principal vem selecionada no pagamento. As carteiras
        são simuladas: nenhuma extensão ou blockchain real é usada.
      </p>

      <p role="status" className="text-sm text-text-accent empty:hidden">
        {success}
      </p>
      <p role="alert" className="text-sm text-text-coral empty:hidden">
        {makePrimaryError}
      </p>

      {wallets.isPending && (
        <div aria-hidden="true" data-testid="wallets-skeleton" className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[150px] rounded-lg" />
          <Skeleton className="h-[150px] rounded-lg" />
        </div>
      )}

      {wallets.isError && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-6 text-sm">
          <p>Não foi possível carregar suas carteiras.</p>
          <Button variant="outline" size="sm" onClick={() => void wallets.refetch()} disabled={wallets.isFetching}>
            {wallets.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        </div>
      )}

      {wallets.isSuccess && walletList.length === 0 && editing?.kind !== 'new' && (
        <p className="rounded-lg bg-surface-card p-6 text-sm">
          Nenhuma carteira cadastrada. Cadastre sua carteira principal para pagar no checkout.
        </p>
      )}

      {wallets.isSuccess && walletList.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Carteiras cadastradas">
          {walletList.map((wallet) =>
            editing?.kind === 'edit' && editing.walletId === wallet.id ? (
              <li key={wallet.id} className="md:col-span-2">
                <WalletForm
                  title={`Editar ${wallet.label}`}
                  initialValues={{ label: wallet.label, address: wallet.address, networks: wallet.networks }}
                  roleChoice={null}
                  isSubmitting={updateWallet.isPending}
                  onSubmit={(values) =>
                    updateWallet.mutateAsync({ walletId: wallet.id, ...values }).then(() => finish('Carteira atualizada.'))
                  }
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                isLocked={lockedWalletIds.has(wallet.id)}
                isBusy={makePrimary.isPending}
                onEdit={() => startEditing({ kind: 'edit', walletId: wallet.id })}
                onMakePrimary={() => {
                  startEditing(null)
                  makePrimary.mutate(wallet.id, { onSuccess: () => setSuccess(`${wallet.label} agora é a carteira principal.`) })
                }}
              />
            ),
          )}
        </ul>
      )}

      {editing?.kind === 'new' ? (
        <WalletForm
          title="Nova carteira"
          initialValues={EMPTY_WALLET}
          roleChoice={walletList.length > 0 ? 'secondary' : null}
          isSubmitting={createWallet.isPending}
          onSubmit={(values, role) => createWallet.mutateAsync({ ...values, role }).then(() => finish('Carteira cadastrada.'))}
          onCancel={() => setEditing(null)}
        />
      ) : (
        canAdd && (
          <Button type="button" onClick={() => startEditing({ kind: 'new' })} className="self-start font-bold text-ink">
            Adicionar carteira
          </Button>
        )
      )}
      {wallets.isSuccess && !canAdd && (
        <p className="text-xs text-text-secondary">Limite atingido: uma carteira principal e uma secundária.</p>
      )}
    </section>
  )
}

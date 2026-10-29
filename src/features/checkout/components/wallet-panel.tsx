import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { useId, useState, type Ref } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { readApiError } from '@/lib/http/api-error'
import { useWalletConnection } from '@/features/wallets/use-wallet-connection'
import {
  PAYMENT_NETWORK_LABELS,
  shortenAddress,
  type PaymentNetworkId,
  type Wallet,
  type WalletConnection,
} from '@/features/wallets/wallet.contracts'
import { walletsQueryOptions } from '@/features/wallets/wallets.api'

type WalletPanelProps = {
  userId: string
  // Set by the checkout when the buyer tries to continue without a connected wallet.
  requirementError: string | null
  connectButtonRef: Ref<HTMLButtonElement>
  disabled: boolean
}

const ACTION_BUTTON_CLASS =
  'flex h-10 items-center justify-center rounded-[5px] px-5 text-[15px] leading-4 font-bold focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 max-md:h-[50px] max-md:rounded-[10px]'

function ConnectedWallet({ connection, onDisconnect, isDisconnecting, disabled }: {
  connection: WalletConnection
  onDisconnect: () => void
  isDisconnecting: boolean
  disabled: boolean
}) {
  return (
    <div data-testid="wallet-connected" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/60 bg-surface-card p-4">
      <div className="flex flex-col gap-1 text-sm">
        <p className="font-bold text-text-accent">Carteira conectada</p>
        <p>
          {connection.walletLabel} · <span className="font-mono">{shortenAddress(connection.address)}</span>
        </p>
        <p className="text-text-secondary">Rede: {PAYMENT_NETWORK_LABELS[connection.network]}</p>
      </div>
      <button
        type="button"
        onClick={onDisconnect}
        disabled={isDisconnecting || disabled}
        className={cn(ACTION_BUTTON_CLASS, 'border border-border hover:border-primary')}
      >
        {isDisconnecting ? 'Desconectando…' : 'Desconectar'}
      </button>
    </div>
  )
}

function WalletOption({ wallet, isSelected, onSelect, name }: {
  wallet: Wallet
  isSelected: boolean
  onSelect: () => void
  name: string
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 text-sm focus-within:ring-2 focus-within:ring-ring',
        isSelected ? 'border-primary bg-surface-card' : 'border-border',
      )}
    >
      <input type="radio" name={name} checked={isSelected} onChange={onSelect} className="mt-0.5 accent-primary" />
      <span className="flex flex-col gap-1">
        <span className="font-bold">
          {wallet.label} {wallet.role === 'primary' && <span className="text-text-secondary">(principal)</span>}
        </span>
        <span className="font-mono text-text-secondary">{shortenAddress(wallet.address)}</span>
        <span className="text-text-secondary">
          Redes: {wallet.networks.map((network) => PAYMENT_NETWORK_LABELS[network]).join(', ')}
        </span>
      </span>
    </label>
  )
}

export function WalletPanel({ userId, requirementError, connectButtonRef, disabled }: WalletPanelProps) {
  const radioName = useId()
  const networkLabelId = useId()
  const errorId = useId()
  const wallets = useQuery(walletsQueryOptions(userId))
  const { connection, connect, disconnect } = useWalletConnection(userId)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<PaymentNetworkId | null>(null)

  const walletList = wallets.data ?? []
  const selectedWallet = walletList.find((wallet) => wallet.id === selectedWalletId) ?? walletList[0]
  const network =
    selectedNetwork && selectedWallet?.networks.includes(selectedNetwork) ? selectedNetwork : selectedWallet?.networks[0]

  const connectError = connect.error ? (readApiError(connect.error)?.message ?? 'Não foi possível conectar a carteira.') : null
  const errorMessage = connectError ?? requirementError
  const statusMessage = connect.isPending
    ? 'Aguardando aprovação na carteira…'
    : connection.data
      ? `Carteira conectada na rede ${PAYMENT_NETWORK_LABELS[connection.data.network]}.`
      : ''

  function handleConnect() {
    if (!selectedWallet || !network) return
    connect.mutate({ walletId: selectedWallet.id, network })
  }

  return (
    <section aria-labelledby="wallet-title" className="flex flex-col gap-5">
      <h2 id="wallet-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
        2. Carteira e rede
      </h2>
      <p role="status" className="sr-only">
        {statusMessage}
      </p>

      {(wallets.isPending || connection.isPending) && (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <Skeleton className="h-[86px] rounded-lg" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      )}

      {(wallets.isError || connection.isError) && (
        <div role="alert" className="flex flex-col items-start gap-2 text-sm">
          <p>Não foi possível carregar suas carteiras.</p>
          <button
            type="button"
            onClick={() => void Promise.all([wallets.refetch(), connection.refetch()])}
            className="text-text-accent underline"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {connection.isSuccess && connection.data && (
        <ConnectedWallet
          connection={connection.data}
          onDisconnect={() => disconnect.mutate()}
          isDisconnecting={disconnect.isPending}
          disabled={disabled}
        />
      )}

      {wallets.isSuccess && connection.isSuccess && !connection.data && walletList.length === 0 && (
        <div data-testid="checkout-no-wallets" className="flex flex-col items-start gap-3 rounded-lg bg-surface-card p-4 text-sm">
          <p>Você ainda não tem carteiras cadastradas.</p>
          <Link to="/perfil/carteiras" className="font-bold text-text-accent underline underline-offset-2">
            Cadastrar carteira no perfil
          </Link>
        </div>
      )}

      {wallets.isSuccess && connection.isSuccess && !connection.data && walletList.length > 0 && (
        <div className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 flex w-full flex-wrap justify-between gap-2 text-[15px] leading-4 font-bold">
              Carteira cadastrada
              <Link to="/perfil/carteiras" className="text-sm font-normal text-text-accent underline underline-offset-2">
                Gerenciar carteiras
              </Link>
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              {walletList.map((wallet) => (
                <WalletOption
                  key={wallet.id}
                  wallet={wallet}
                  name={radioName}
                  isSelected={wallet.id === selectedWallet?.id}
                  onSelect={() => {
                    setSelectedWalletId(wallet.id)
                    connect.reset()
                  }}
                />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <span id={networkLabelId} className="text-[15px] leading-4 font-bold">
                Rede de pagamento
              </span>
              <Select value={network} onValueChange={(value) => setSelectedNetwork(value as PaymentNetworkId)}>
                <SelectTrigger aria-labelledby={networkLabelId} className="h-10 w-[180px] rounded-[5px] border-border max-md:h-[50px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {selectedWallet?.networks.map((option) => (
                    <SelectItem key={option} value={option}>
                      {PAYMENT_NETWORK_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button
              ref={connectButtonRef}
              type="button"
              onClick={handleConnect}
              disabled={connect.isPending || disabled || !selectedWallet}
              aria-describedby={errorMessage ? errorId : undefined}
              className={cn(ACTION_BUTTON_CLASS, 'bg-primary text-ink hover:bg-primary/90')}
            >
              {connect.isPending ? 'Aguardando aprovação…' : 'Conectar carteira'}
            </button>
          </div>
          <p className="text-xs text-text-secondary">
            Carteira simulada: a aprovação ou recusa vem do cenário ativo da API simulada.
          </p>
        </div>
      )}

      <p id={errorId} role="alert" className="text-sm text-text-coral empty:hidden">
        {connection.data ? null : errorMessage}
      </p>
    </section>
  )
}

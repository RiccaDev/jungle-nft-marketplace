import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { featuredNftQueryOptions } from '@/features/nfts/nfts.api'
import { formatEth } from '@/lib/eth/eth-amount'
import { useSocketStatus } from '@/lib/realtime/use-socket-connection'
import { requestMockMarketChange } from './mock-market-control.api'
import { useLastNftUpdatedEvent } from './use-last-nft-updated-event'

export function RealtimeDemoPanel() {
  const { isConnected, connect, disconnect } = useSocketStatus()
  const featuredNft = useQuery(featuredNftQueryOptions())
  const lastEvent = useLastNftUpdatedEvent(featuredNft.data?.id)
  const marketChange = useMutation({ mutationFn: requestMockMarketChange })

  return (
    <section
      aria-labelledby="realtime-demo-title"
      aria-busy={featuredNft.isPending}
      className="space-y-4 rounded-lg border bg-card p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="realtime-demo-title" className="text-sm text-muted-foreground">
          Socket.IO · nft.updated
        </h2>
        <p data-testid="socket-status" className="text-sm">
          Socket: {isConnected ? 'conectado' : 'desconectado'}
        </p>
      </div>

      {featuredNft.isPending && <p>Carregando NFT…</p>}

      {featuredNft.isError && (
        <p className="text-destructive">Falha ao carregar o NFT: {featuredNft.error.message}</p>
      )}

      {featuredNft.isSuccess && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">NFT</dt>
          <dd>{featuredNft.data.name}</dd>
          <dt className="text-muted-foreground">preço</dt>
          <dd data-testid="demo-nft-price">{formatEth(featuredNft.data.priceEth)}</dd>
          <dt className="text-muted-foreground">disponível</dt>
          <dd data-testid="demo-nft-available">{featuredNft.data.availableQuantity}</dd>
          <dt className="text-muted-foreground">versão</dt>
          <dd data-testid="demo-nft-version">{featuredNft.data.version}</dd>
        </dl>
      )}

      <p role="status" aria-live="polite" data-testid="realtime-last-event" className="text-sm">
        {lastEvent ? `Evento ${lastEvent.eventId} recebido via Socket.IO.` : 'Nenhum evento recebido.'}
      </p>

      {marketChange.isError && (
        <p role="alert" className="text-destructive">
          Falha ao solicitar a alteração: {marketChange.error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => featuredNft.data && marketChange.mutate(featuredNft.data.id)}
          disabled={!featuredNft.isSuccess || marketChange.isPending}
        >
          Simular alteração no servidor
        </Button>
        <Button variant="secondary" onClick={isConnected ? disconnect : connect}>
          {isConnected ? 'Desconectar socket' : 'Reconectar socket'}
        </Button>
      </div>
    </section>
  )
}

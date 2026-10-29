import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useSocketConnection } from '@/lib/realtime/use-socket-connection'
import { demoNftQueryOptions, requestMockNftUpdate } from './demo-nft.api'
import { useDemoNftRealtimeSync } from './use-demo-nft-realtime-sync'

export function RealtimeDemoPanel() {
  const { isConnected, connect, disconnect } = useSocketConnection()
  const { lastAppliedEvent } = useDemoNftRealtimeSync()
  const demoNft = useQuery(demoNftQueryOptions())
  const mockNftUpdate = useMutation({ mutationFn: requestMockNftUpdate })

  return (
    <section
      aria-labelledby="realtime-demo-title"
      aria-busy={demoNft.isPending}
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

      {demoNft.isPending && <p>Carregando NFT…</p>}

      {demoNft.isError && (
        <p className="text-destructive">Falha ao carregar o NFT: {demoNft.error.message}</p>
      )}

      {demoNft.isSuccess && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">NFT</dt>
          <dd>{demoNft.data.name}</dd>
          <dt className="text-muted-foreground">preço</dt>
          <dd data-testid="demo-nft-price">{demoNft.data.priceEth} ETH</dd>
          <dt className="text-muted-foreground">disponível</dt>
          <dd data-testid="demo-nft-available">{demoNft.data.availableQuantity}</dd>
          <dt className="text-muted-foreground">versão</dt>
          <dd data-testid="demo-nft-version">{demoNft.data.version}</dd>
        </dl>
      )}

      <p role="status" aria-live="polite" data-testid="realtime-last-event" className="text-sm">
        {lastAppliedEvent
          ? `Evento ${lastAppliedEvent.eventId} recebido via Socket.IO.`
          : 'Nenhum evento recebido.'}
      </p>

      {mockNftUpdate.isError && (
        <p role="alert" className="text-destructive">
          Falha ao solicitar a alteração: {mockNftUpdate.error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => mockNftUpdate.mutate()}
          disabled={!demoNft.isSuccess || mockNftUpdate.isPending}
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

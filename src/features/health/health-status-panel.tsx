import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { healthQueryOptions } from './health.api'

export function HealthStatusPanel() {
  const health = useQuery(healthQueryOptions())

  return (
    <section
      aria-labelledby="health-status-title"
      aria-busy={health.isPending}
      className="space-y-3 rounded-lg border bg-card p-6"
    >
      <h2 id="health-status-title" className="text-sm text-muted-foreground">
        GET /api/health
      </h2>

      <div role="status" aria-live="polite">
        {health.isPending && <p>Consultando…</p>}

        {health.isError && (
          <p className="text-destructive">Falha ao consultar a API: {health.error.message}</p>
        )}

        {health.isSuccess && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-muted-foreground">status</dt>
            <dd data-testid="health-status">{health.data.status}</dd>
            <dt className="text-muted-foreground">timestamp</dt>
            <dd>
              <time dateTime={health.data.timestamp}>{health.data.timestamp}</time>
            </dd>
          </dl>
        )}
      </div>

      <Button onClick={() => void health.refetch()} disabled={health.isFetching}>
        {health.isFetching ? 'Atualizando…' : 'Consultar novamente'}
      </Button>
    </section>
  )
}

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { healthQueryOptions } from '@/features/health/health.api'

// Provisional page: proves Router + Query + Axios + MSW are wired end to end.
export const Route = createFileRoute('/')({
  component: HealthPage,
})

function HealthPage() {
  const health = useQuery(healthQueryOptions())

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6">
      <header className="space-y-2">
        <p className="text-sm text-text-accent">Fundação do projeto</p>
        <h1 className="text-2xl font-bold">Status da API</h1>
      </header>

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
    </main>
  )
}

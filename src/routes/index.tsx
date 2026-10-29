import { createFileRoute } from '@tanstack/react-router'
import { HealthStatusPanel } from '@/features/health/health-status-panel'
import { RealtimeDemoPanel } from '@/features/realtime-demo/realtime-demo-panel'

// Provisional page: proves Router + Query + Axios + MSW + Socket.IO are wired end to end.
export const Route = createFileRoute('/')({
  component: FoundationCheckPage,
})

function FoundationCheckPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm text-text-accent">Fundação do projeto</p>
        <h1 className="text-2xl font-bold">Status da API</h1>
      </header>

      <HealthStatusPanel />
      <RealtimeDemoPanel />
    </main>
  )
}

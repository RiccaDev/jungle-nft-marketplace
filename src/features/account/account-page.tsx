import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { accountQueryOptions } from '@/features/auth/auth.api'
import { useLogout } from '@/features/auth/use-auth'

function formatMemberSince(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// Account summary backed by a private endpoint; profile editing arrives in a later step.
export function AccountPage({ userId }: { userId: string }) {
  const account = useQuery(accountQueryOptions(userId))
  const logoutMutation = useLogout()

  return (
    <div className="page-container flex flex-col gap-8 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Perfil do colecionador</h1>
        <Button
          variant="outline"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? 'Saindo…' : 'Sair'}
        </Button>
      </header>

      <section aria-labelledby="account-title" aria-busy={account.isPending} className="flex max-w-xl flex-col gap-4 rounded-lg bg-surface-card p-6">
        <h2 id="account-title" className="text-lg font-bold text-text-accent">
          Dados da conta
        </h2>

        {account.isPending && (
          <div aria-hidden="true" className="flex flex-col gap-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
          </div>
        )}

        {account.isError && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-muted-foreground">Não foi possível carregar os dados da conta.</p>
            <Button variant="outline" size="sm" onClick={() => void account.refetch()}>
              Tentar novamente
            </Button>
          </div>
        )}

        {account.isSuccess && (
          <dl data-testid="account-details" className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-[15px]">
            <dt className="text-text-secondary">Nome</dt>
            <dd>{account.data.displayName}</dd>
            <dt className="text-text-secondary">Usuário</dt>
            <dd>@{account.data.username}</dd>
            <dt className="text-text-secondary">E-mail</dt>
            <dd>{account.data.email}</dd>
            <dt className="text-text-secondary">Membro desde</dt>
            <dd>{formatMemberSince(account.data.memberSince)}</dd>
          </dl>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        Edição de perfil, avatar, senha e carteiras serão habilitados nas próximas etapas.
      </p>
    </div>
  )
}

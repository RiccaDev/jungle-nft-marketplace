import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { accountQueryOptions } from '@/features/auth/auth.api'
import { useLogout } from '@/features/auth/use-auth'
import { AccountAvatar } from './account-avatar'

function formatMemberSince(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const TAB_CLASS =
  '-mb-px block shrink-0 border-b-2 pb-3 text-[15px] font-bold whitespace-nowrap hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
// Colors live only in the state props, so active and inactive classes never compete.
const ACTIVE_TAB_PROPS = { className: 'border-primary text-text-accent', 'aria-current': 'page' as const }
const INACTIVE_TAB_PROPS = { className: 'border-transparent text-text-secondary' }

function AccountSummary({ userId }: { userId: string }) {
  const account = useQuery(accountQueryOptions(userId))

  return (
    <section
      aria-label="Resumo da conta"
      aria-busy={account.isPending}
      className="flex flex-wrap items-center gap-5 rounded-lg bg-surface-card p-6"
    >
      {account.isPending && (
        <div aria-hidden="true" className="flex items-center gap-5">
          <Skeleton className="size-[72px] rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
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
        <>
          <AccountAvatar displayName={account.data.displayName} src={account.data.avatarUrl} size={72} />
          <dl data-testid="account-details" className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[15px]">
            <dt className="text-text-secondary">Nome</dt>
            <dd>{account.data.displayName}</dd>
            <dt className="text-text-secondary">Usuário</dt>
            <dd>@{account.data.username}</dd>
            <dt className="text-text-secondary">E-mail</dt>
            <dd className="break-all">{account.data.email}</dd>
            <dt className="text-text-secondary">Membro desde</dt>
            <dd>{formatMemberSince(account.data.memberSince)}</dd>
          </dl>
        </>
      )}
    </section>
  )
}

// Shared frame of /perfil, /perfil/carteiras and /perfil/pedidos.
export function ProfileLayout({ userId, children }: { userId: string; children: ReactNode }) {
  const logoutMutation = useLogout()

  return (
    <div className="page-container flex flex-col gap-8 py-8 md:py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Perfil do colecionador</h1>
        <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
          {logoutMutation.isPending ? 'Saindo…' : 'Sair'}
        </Button>
      </header>

      <AccountSummary userId={userId} />

      <nav aria-label="Seções do perfil" className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
        <ul className="flex gap-8 border-b border-primary/40">
          <li>
            <Link to="/perfil" activeOptions={{ exact: true }} activeProps={ACTIVE_TAB_PROPS} inactiveProps={INACTIVE_TAB_PROPS} className={TAB_CLASS}>
              Dados e segurança
            </Link>
          </li>
          <li>
            <Link to="/perfil/carteiras" activeProps={ACTIVE_TAB_PROPS} inactiveProps={INACTIVE_TAB_PROPS} className={TAB_CLASS}>
              Carteiras
            </Link>
          </li>
          <li>
            <Link to="/perfil/pedidos" activeProps={ACTIVE_TAB_PROPS} inactiveProps={INACTIVE_TAB_PROPS} className={TAB_CLASS}>
              Pedidos
            </Link>
          </li>
        </ul>
      </nav>

      {children}
    </div>
  )
}

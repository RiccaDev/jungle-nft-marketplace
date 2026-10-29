import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/auth.api'
import { parseAuthSearch } from '@/features/auth/auth-search'
import { AuthScreen } from '@/features/auth/components/auth-screen'

export const Route = createFileRoute('/entrar')({
  validateSearch: parseAuthSearch,
  beforeLoad: async ({ context, search }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
    if (session) throw redirect({ href: search.redirect ?? '/' })
  },
  component: LoginRoute,
})

function LoginRoute() {
  return <AuthScreen mode="login" search={Route.useSearch()} />
}

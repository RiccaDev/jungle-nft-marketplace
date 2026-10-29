import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/auth.api'
import { readSessionToken } from '@/lib/http/session-token-storage'

// Pathless layout guarding every private route (profile, wallets, favorites, checkout).
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const hadStoredSession = Boolean(readSessionToken())
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions())
    if (!session) {
      throw redirect({
        to: '/entrar',
        search: {
          redirect: location.href,
          reason: hadStoredSession ? 'session-expired' : undefined,
        },
      })
    }
    return { sessionUser: session.user }
  },
  component: Outlet,
})

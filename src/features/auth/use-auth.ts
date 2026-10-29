import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { login, logout, register, sessionQueryOptions } from './auth.api'
import type { AuthSession } from './auth.contracts'
import { endSession, startSession } from './session-cache'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

export function useSession() {
  const session = useQuery(sessionQueryOptions())
  const status: SessionStatus = session.isPending
    ? 'loading'
    : session.data
      ? 'authenticated'
      : 'anonymous'

  return { status, user: session.data?.user ?? null }
}

function useStartSession() {
  const queryClient = useQueryClient()
  return (session: AuthSession) => startSession(queryClient, session)
}

export function useLogin() {
  const handleSession = useStartSession()
  return useMutation({ mutationFn: login, onSuccess: handleSession })
}

export function useRegister() {
  const handleSession = useStartSession()
  return useMutation({ mutationFn: register, onSuccess: handleSession })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    // The local session ends even if the server cannot be reached.
    mutationFn: () => logout().catch(() => undefined),
    onSettled: async () => {
      await endSession(queryClient)
      await navigate({ to: '/' })
    },
  })
}

// Integration point for favorites, wallets and checkout: actions that need an account
// send visitors to the login screen and bring them back to where they were.
export function useRequireAuthentication() {
  const { status } = useSession()
  const navigate = useNavigate()
  const currentHref = useLocation({ select: (location) => location.href })

  return {
    isAuthenticated: status === 'authenticated',
    redirectToLogin: () => navigate({ to: '/entrar', search: { redirect: currentHref } }),
  }
}

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { onSessionRejected } from '@/lib/http/session-events'
import { endSession } from './session-cache'
import { useSession } from './use-auth'

export const PRIVATE_ROUTE_ID_PREFIX = '/_authenticated'

// Mounted once at the root: reacts to the API rejecting the current session (expiration,
// revocation) by discarding private data and resuming the flow after a new login.
export function useSessionLifecycle() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [hasExpiredSessionNotice, setHasExpiredSessionNotice] = useState(false)
  const { status } = useSession()

  useEffect(
    () =>
      onSessionRejected(() => {
        setHasExpiredSessionNotice(true)
        void endSession(queryClient).then(() => {
          const isOnPrivateRoute = router.state.matches.some((match) =>
            match.routeId.startsWith(PRIVATE_ROUTE_ID_PREFIX),
          )
          if (!isOnPrivateRoute) return router.invalidate()
          return router.navigate({
            to: '/entrar',
            search: { redirect: router.state.location.href, reason: 'session-expired' },
          })
        })
      }),
    [queryClient, router],
  )

  return {
    // A new login supersedes the notice about the previous session.
    hasExpiredSessionNotice: hasExpiredSessionNotice && status !== 'authenticated',
    dismissExpiredSessionNotice: () => setHasExpiredSessionNotice(false),
  }
}

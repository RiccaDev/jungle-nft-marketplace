import type { QueryClient } from '@tanstack/react-query'
import { clearSessionToken, writeSessionToken } from '@/lib/http/session-token-storage'
import { reconnectWithCurrentSession } from '@/lib/realtime/socket-client'
import type { AuthSession, SessionResponse } from './auth.contracts'
import { privateQueryKeys, sessionQueryOptions } from './auth.api'

const sessionQueryKey = sessionQueryOptions().queryKey

// Order matters: in-flight private requests are cancelled before the identity changes, so a
// late response of the previous user can never land in the cache of the next one.
async function discardPrivateData(queryClient: QueryClient) {
  await queryClient.cancelQueries({ queryKey: privateQueryKeys.all })
  queryClient.removeQueries({ queryKey: privateQueryKeys.all })
}

export async function startSession(queryClient: QueryClient, session: AuthSession) {
  await discardPrivateData(queryClient)
  writeSessionToken(session.token)
  const sessionData: SessionResponse = { user: session.user, expiresAt: session.expiresAt }
  queryClient.setQueryData(sessionQueryKey, sessionData)
  reconnectWithCurrentSession()
}

export async function endSession(queryClient: QueryClient) {
  await discardPrivateData(queryClient)
  clearSessionToken()
  queryClient.setQueryData(sessionQueryKey, null)
  reconnectWithCurrentSession()
}

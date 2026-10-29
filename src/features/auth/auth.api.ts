import { queryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/http/api-client'
import { hasHttpStatus } from '@/lib/http/api-error'
import { readSessionToken } from '@/lib/http/session-token-storage'
import type {
  AccountResponse,
  AuthSession,
  LoginRequest,
  RegisterRequest,
  SessionResponse,
} from './auth.contracts'

export const authQueryKeys = {
  session: ['auth', 'session'] as const,
}

// Every user-scoped query lives under ['private', userId]: removing this prefix on logout or
// user switch drops all private data, and the userId keeps caches of two users apart.
export const privateQueryKeys = {
  all: ['private'] as const,
  user: (userId: string) => [...privateQueryKeys.all, userId] as const,
  account: (userId: string) => [...privateQueryKeys.user(userId), 'account'] as const,
}

export async function login(request: LoginRequest) {
  const { data } = await apiClient.post<AuthSession>('/auth/login', request)
  return data
}

export async function register(request: RegisterRequest) {
  const { data } = await apiClient.post<AuthSession>('/auth/register', request)
  return data
}

export async function logout() {
  await apiClient.post('/auth/logout')
}

export async function getSession(signal?: AbortSignal): Promise<SessionResponse | null> {
  if (!readSessionToken()) return null
  try {
    const { data } = await apiClient.get<SessionResponse>('/auth/session', { signal })
    return data
  } catch (error) {
    if (hasHttpStatus(error, 401)) return null
    throw error
  }
}

export async function getAccount(signal?: AbortSignal) {
  const { data } = await apiClient.get<AccountResponse>('/me/account', { signal })
  return data
}

export const sessionQueryOptions = () =>
  queryOptions({
    queryKey: authQueryKeys.session,
    queryFn: ({ signal }) => getSession(signal),
    staleTime: 5 * 60_000,
  })

export const accountQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: privateQueryKeys.account(userId),
    queryFn: ({ signal }) => getAccount(signal),
  })

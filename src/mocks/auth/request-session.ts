import { HttpResponse } from 'msw'
import { AUTH_ERROR_CODES } from '@/features/auth/auth.contracts'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { lookupSession } from '../state/auth.state'

export function readBearerToken(request: Request) {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null
}

export function unauthorizedResponse(code: string, message: string) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message } }, { status: 401 })
}

// Resolves the caller of a private endpoint, or the 401 response explaining why it cannot.
export function resolveRequestSession(request: Request) {
  const lookup = lookupSession(readBearerToken(request))
  if (lookup.status === 'active') return lookup
  return lookup.status === 'expired'
    ? unauthorizedResponse(AUTH_ERROR_CODES.sessionExpired, 'Sua sessão expirou.')
    : unauthorizedResponse(AUTH_ERROR_CODES.unauthenticated, 'É necessário entrar para continuar.')
}

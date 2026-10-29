import { http, HttpResponse } from 'msw'
import {
  AUTH_ERROR_CODES,
  type AccountResponse,
  type AuthSession,
  type LoginRequest,
  type RegisterRequest,
  type SessionResponse,
} from '@/features/auth/auth.contracts'
import { hasFieldErrors, validateLogin, validateRegistration } from '@/features/auth/auth-validation'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { readBearerToken, resolveRequestSession } from '../auth/request-session'
import { applyNetworkConditions } from '../network/network-conditions'
import {
  createSession,
  createUser,
  findUserByEmail,
  findUserByUsername,
  revokeSession,
  toAccount,
  toAuthUser,
  verifyCredentials,
} from '../state/auth.state'
import type { MockUserRecord } from '../fixtures/user.fixtures'

function errorResponse(status: number, error: ApiErrorBody['error']) {
  return HttpResponse.json<ApiErrorBody>({ error }, { status })
}

function sessionResponse(user: MockUserRecord, status: number) {
  const session = createSession(user.id)
  return HttpResponse.json<AuthSession>(
    { token: session.token, expiresAt: session.expiresAt, user: toAuthUser(user) },
    { status },
  )
}

async function readJsonBody<Body>(request: Request): Promise<Partial<Body>> {
  try {
    return (await request.json()) as Partial<Body>
  } catch {
    return {}
  }
}

export const authHandlers = [
  http.post(apiUrl('/auth/register'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse

    const body = await readJsonBody<RegisterRequest>(request)
    const input = { username: body.username ?? '', email: body.email ?? '', password: body.password ?? '' }
    const fieldErrors = validateRegistration(input)
    if (hasFieldErrors(fieldErrors)) {
      return errorResponse(422, {
        code: AUTH_ERROR_CODES.validationFailed,
        message: 'Revise os campos destacados.',
        fieldErrors,
      })
    }
    if (findUserByEmail(input.email)) {
      return errorResponse(409, {
        code: AUTH_ERROR_CODES.emailTaken,
        message: 'Este e-mail já está cadastrado.',
        fieldErrors: { email: 'Este e-mail já está cadastrado.' },
      })
    }
    if (findUserByUsername(input.username)) {
      return errorResponse(409, {
        code: AUTH_ERROR_CODES.usernameTaken,
        message: 'Este nome de usuário já está em uso.',
        fieldErrors: { username: 'Este nome de usuário já está em uso.' },
      })
    }

    return sessionResponse(await createUser(input), 201)
  }),

  http.post(apiUrl('/auth/login'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse

    const body = await readJsonBody<LoginRequest>(request)
    const input = { email: body.email ?? '', password: body.password ?? '' }
    const fieldErrors = validateLogin(input)
    if (hasFieldErrors(fieldErrors)) {
      return errorResponse(422, {
        code: AUTH_ERROR_CODES.validationFailed,
        message: 'Revise os campos destacados.',
        fieldErrors,
      })
    }

    const user = await verifyCredentials(input.email, input.password)
    if (!user) {
      return errorResponse(401, {
        code: AUTH_ERROR_CODES.invalidCredentials,
        message: 'E-mail ou senha incorretos.',
      })
    }
    return sessionResponse(user, 200)
  }),

  http.get(apiUrl('/auth/session'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse

    const resolution = resolveRequestSession(request)
    if (resolution instanceof Response) return resolution
    return HttpResponse.json<SessionResponse>({
      user: toAuthUser(resolution.user),
      expiresAt: resolution.session.expiresAt,
    })
  }),

  // Idempotent: logging out with an unknown or expired token still succeeds.
  http.post(apiUrl('/auth/logout'), ({ request }) => {
    const token = readBearerToken(request)
    if (token) revokeSession(token)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(apiUrl('/me/account'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse

    const resolution = resolveRequestSession(request)
    if (resolution instanceof Response) return resolution
    return HttpResponse.json<AccountResponse>(toAccount(resolution.user))
  }),
]

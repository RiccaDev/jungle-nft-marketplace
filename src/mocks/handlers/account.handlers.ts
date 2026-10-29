import { http, HttpResponse } from 'msw'
import {
  ACCOUNT_ERROR_CODES,
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  type AvatarMimeType,
  type ChangePasswordRequest,
  type UpdateAvatarRequest,
  type UpdateProfileRequest,
} from '@/features/account/account.contracts'
import { validatePasswordChange, validateProfile } from '@/features/account/account-validation'
import { AUTH_ERROR_CODES, type AccountResponse } from '@/features/auth/auth.contracts'
import { hasFieldErrors, normalizeEmail } from '@/features/auth/auth-validation'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { readBearerToken, resolveRequestSession } from '../auth/request-session'
import { applyNetworkConditions } from '../network/network-conditions'
import {
  changePassword,
  findUserByEmail,
  findUserByUsername,
  toAccount,
  updateUser,
  verifyUserPassword,
} from '../state/auth.state'

// First bytes of each accepted format: the declared type must match the actual content.
const IMAGE_SIGNATURES: Record<AvatarMimeType, (bytes: Uint8Array) => boolean> = {
  'image/png': (bytes) => [0x89, 0x50, 0x4e, 0x47].every((byte, index) => bytes[index] === byte),
  'image/jpeg': (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  'image/webp': (bytes) =>
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP',
}
const DATA_URL_PATTERN = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+={0,2})$/

function errorResponse(status: number, error: ApiErrorBody['error']) {
  return HttpResponse.json<ApiErrorBody>({ error }, { status })
}

async function readJsonBody<Body>(request: Request): Promise<Partial<Body>> {
  try {
    return (await request.json()) as Partial<Body>
  } catch {
    return {}
  }
}

async function prepareAccountRequest(request: Request) {
  const simulatedResponse = await applyNetworkConditions(request)
  if (simulatedResponse) return simulatedResponse
  return resolveRequestSession(request)
}

function decodeAvatar(dataUrl: unknown): { error: string } | { dataUrl: string } {
  const match = typeof dataUrl === 'string' ? DATA_URL_PATTERN.exec(dataUrl) : null
  const mimeType = AVATAR_MIME_TYPES.find((type) => type === match?.[1])
  if (!match?.[2] || !mimeType) return { error: 'Use uma imagem PNG, JPEG ou WebP.' }

  const binary = atob(match[2])
  if (binary.length > AVATAR_MAX_BYTES) return { error: `A imagem deve ter no máximo ${AVATAR_MAX_BYTES / 1024} KB.` }
  const header = Uint8Array.from(binary.slice(0, 12), (character) => character.charCodeAt(0))
  if (!IMAGE_SIGNATURES[mimeType](header)) return { error: 'O conteúdo do arquivo não é uma imagem válida.' }
  return { dataUrl: match[0] }
}

export const accountHandlers = [
  http.patch(apiUrl('/me/account'), async ({ request }) => {
    const session = await prepareAccountRequest(request)
    if (session instanceof Response) return session

    const body = await readJsonBody<UpdateProfileRequest>(request)
    const input = { displayName: body.displayName ?? '', username: body.username ?? '', email: body.email ?? '' }
    const fieldErrors = validateProfile(input)
    if (hasFieldErrors(fieldErrors)) {
      return errorResponse(422, { code: AUTH_ERROR_CODES.validationFailed, message: 'Revise os campos destacados.', fieldErrors })
    }

    // Uniqueness ignores the user's own record, so saving unchanged values is not a conflict.
    const emailOwner = findUserByEmail(input.email)
    if (emailOwner && emailOwner.id !== session.user.id) {
      return errorResponse(409, {
        code: AUTH_ERROR_CODES.emailTaken,
        message: 'Este e-mail já está cadastrado.',
        fieldErrors: { email: 'Este e-mail já está cadastrado.' },
      })
    }
    const usernameOwner = findUserByUsername(input.username)
    if (usernameOwner && usernameOwner.id !== session.user.id) {
      return errorResponse(409, {
        code: AUTH_ERROR_CODES.usernameTaken,
        message: 'Este nome de usuário já está em uso.',
        fieldErrors: { username: 'Este nome de usuário já está em uso.' },
      })
    }

    const updatedUser = updateUser(session.user.id, {
      displayName: input.displayName.trim(),
      username: input.username.trim(),
      email: normalizeEmail(input.email),
    })
    return updatedUser ? HttpResponse.json<AccountResponse>(toAccount(updatedUser)) : HttpResponse.json(null, { status: 404 })
  }),

  http.put(apiUrl('/me/avatar'), async ({ request }) => {
    const session = await prepareAccountRequest(request)
    if (session instanceof Response) return session

    const body = await readJsonBody<UpdateAvatarRequest>(request)
    const avatar = decodeAvatar(body.dataUrl)
    if ('error' in avatar) {
      return errorResponse(422, {
        code: ACCOUNT_ERROR_CODES.avatarInvalid,
        message: avatar.error,
        fieldErrors: { avatar: avatar.error },
      })
    }
    const updatedUser = updateUser(session.user.id, { avatarUrl: avatar.dataUrl })
    return updatedUser ? HttpResponse.json<AccountResponse>(toAccount(updatedUser)) : HttpResponse.json(null, { status: 404 })
  }),

  http.delete(apiUrl('/me/avatar'), async ({ request }) => {
    const session = await prepareAccountRequest(request)
    if (session instanceof Response) return session
    const updatedUser = updateUser(session.user.id, { avatarUrl: null })
    return updatedUser ? HttpResponse.json<AccountResponse>(toAccount(updatedUser)) : HttpResponse.json(null, { status: 404 })
  }),

  http.put(apiUrl('/me/password'), async ({ request }) => {
    const session = await prepareAccountRequest(request)
    if (session instanceof Response) return session

    const body = await readJsonBody<ChangePasswordRequest>(request)
    const input = { currentPassword: body.currentPassword ?? '', newPassword: body.newPassword ?? '' }
    const fieldErrors = validatePasswordChange(input)
    if (hasFieldErrors(fieldErrors)) {
      return errorResponse(422, { code: AUTH_ERROR_CODES.validationFailed, message: 'Revise os campos destacados.', fieldErrors })
    }
    if (!(await verifyUserPassword(session.user, input.currentPassword))) {
      return errorResponse(422, {
        code: ACCOUNT_ERROR_CODES.invalidCurrentPassword,
        message: 'A senha atual está incorreta.',
        fieldErrors: { currentPassword: 'A senha atual está incorreta.' },
      })
    }

    await changePassword(session.user.id, input.newPassword, readBearerToken(request) ?? '')
    return new HttpResponse(null, { status: 204 })
  }),
]

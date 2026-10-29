export type AuthUser = {
  id: string
  username: string
  email: string
  displayName: string
}

export type AuthSession = {
  token: string
  expiresAt: string
  user: AuthUser
}

export type SessionResponse = Omit<AuthSession, 'token'>

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
}

export type AccountResponse = AuthUser & {
  memberSince: string
}

export const AUTH_ERROR_CODES = {
  validationFailed: 'VALIDATION_FAILED',
  invalidCredentials: 'INVALID_CREDENTIALS',
  emailTaken: 'EMAIL_TAKEN',
  usernameTaken: 'USERNAME_TAKEN',
  unauthenticated: 'UNAUTHENTICATED',
  sessionExpired: 'SESSION_EXPIRED',
} as const

const AUTH_PATH_PREFIXES = ['/entrar', '/cadastro']

export type AuthSearch = {
  redirect?: string
  reason?: 'session-expired'
}

// Only same-origin paths are accepted, preventing open redirects through `?redirect=`.
export function sanitizeRedirectTarget(value: unknown) {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined
  if (AUTH_PATH_PREFIXES.some((prefix) => value.startsWith(prefix))) return undefined
  return value
}

export function parseAuthSearch(raw: Record<string, unknown>): AuthSearch {
  return {
    redirect: sanitizeRedirectTarget(raw.redirect),
    reason: raw.reason === 'session-expired' ? 'session-expired' : undefined,
  }
}

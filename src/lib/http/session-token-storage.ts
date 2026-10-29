// Demo limitation: the mocked API cannot issue httpOnly cookies, so the opaque session token
// lives in localStorage and is sent as a Bearer header. A real backend should use httpOnly cookies.
const SESSION_TOKEN_KEY = 'kurio.session-token'

export function readSessionToken() {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeSessionToken(token: string) {
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token)
  } catch {
    // Without storage the session still works until the page is reloaded.
  }
}

export function clearSessionToken() {
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

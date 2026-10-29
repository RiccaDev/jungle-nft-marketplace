import axios from 'axios'
import { readApiError } from './api-error'
import { API_BASE_URL } from './config'
import { notifySessionRejected } from './session-events'
import { readSessionToken } from './session-token-storage'

const SESSION_REJECTION_CODES = new Set(['UNAUTHENTICATED', 'SESSION_EXPIRED'])

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = readSessionToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 on a request that carried the current token means the session ended on the server
// side. A late 401 for a token that was already replaced (logout, user switch) is ignored:
// it must never end the session that came after it.
apiClient.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = readApiError(error)
  const sentAuthorization = axios.isAxiosError(error) ? error.config?.headers?.Authorization : undefined
  const currentToken = readSessionToken()
  const sentCurrentToken = Boolean(currentToken) && sentAuthorization === `Bearer ${currentToken}`
  if (sentCurrentToken && apiError && SESSION_REJECTION_CODES.has(apiError.code)) {
    notifySessionRejected()
  }
  return Promise.reject(error)
})

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

// A 401 on a request that carried a token means the session ended on the server side.
apiClient.interceptors.response.use(undefined, (error: unknown) => {
  const apiError = readApiError(error)
  const sentToken = axios.isAxiosError(error) && Boolean(error.config?.headers?.Authorization)
  if (sentToken && apiError && SESSION_REJECTION_CODES.has(apiError.code)) {
    notifySessionRejected()
  }
  return Promise.reject(error)
})

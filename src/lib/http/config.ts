// Shared by the Axios client and the MSW handlers so both resolve the same URLs.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`
}

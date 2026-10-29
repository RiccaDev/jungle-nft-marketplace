import { QueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'

const MAX_RETRIES = 2

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Client errors (4xx) are deterministic; only transient failures are retried.
        retry: (failureCount, error) => {
          const status = isAxiosError(error) ? error.response?.status : undefined
          if (status !== undefined && status >= 400 && status < 500) return false
          return failureCount < MAX_RETRIES
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

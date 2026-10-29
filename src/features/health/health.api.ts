import { queryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/http/api-client'

export type HealthResponse = {
  status: 'ok'
  timestamp: string
}

export async function getHealth(signal?: AbortSignal) {
  const { data } = await apiClient.get<HealthResponse>('/health', { signal })
  return data
}

export const healthQueryOptions = () =>
  queryOptions({
    queryKey: ['health'],
    queryFn: ({ signal }) => getHealth(signal),
  })

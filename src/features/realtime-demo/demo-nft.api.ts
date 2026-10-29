import { queryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/http/api-client'

export type DemoNft = {
  id: string
  name: string
  priceEth: string
  availableQuantity: number
  version: number
}

export const demoNftQueryKey = ['realtime-demo', 'nft'] as const

export async function getDemoNft(signal?: AbortSignal) {
  const { data } = await apiClient.get<DemoNft>('/demo/nft', { signal })
  return data
}

export const demoNftQueryOptions = () =>
  queryOptions({
    queryKey: demoNftQueryKey,
    queryFn: ({ signal }) => getDemoNft(signal),
  })

// Mock-only control endpoint: the change is applied by the mock server and
// delivered back exclusively through the `nft.updated` Socket.IO event.
export async function requestMockNftUpdate() {
  await apiClient.post('/__mocks__/nft-updates')
}

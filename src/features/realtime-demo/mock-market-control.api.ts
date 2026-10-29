import { apiClient } from '@/lib/http/api-client'

// Mock-only control endpoint used by the diagnostics page: the change is applied by the
// mock server and reaches the interface exclusively through the `nft.updated` event.
export async function requestMockMarketChange(nftId: string) {
  await apiClient.post(`/__mocks__/nfts/${encodeURIComponent(nftId)}/market-change`)
}

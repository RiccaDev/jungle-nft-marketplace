import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/http/api-client'
import type { NftListFilters, NftListRequest, NftListResponse, NftSummary } from './nft.contracts'
import { serializeNftListRequest, toNftListRequest } from './nft-list-filters'

export const nftQueryKeys = {
  all: ['nfts'] as const,
  list: (request: NftListRequest) => [...nftQueryKeys.all, 'list', request] as const,
  featured: () => [...nftQueryKeys.all, 'featured'] as const,
}

export async function getNftList(request: NftListRequest, signal?: AbortSignal) {
  const { data } = await apiClient.get<NftListResponse>('/nfts', {
    params: serializeNftListRequest(request),
    signal,
  })
  return data
}

export async function getFeaturedNft(signal?: AbortSignal) {
  const { data } = await apiClient.get<NftSummary>('/nfts/featured', { signal })
  return data
}

export const nftListQueryOptions = (filters: NftListFilters) => {
  const request = toNftListRequest(filters)

  return queryOptions({
    queryKey: nftQueryKeys.list(request),
    queryFn: ({ signal }) => getNftList(request, signal),
    // Keeps the previous page on screen while the next parameters load, instead of
    // flashing skeletons on every filter change.
    placeholderData: keepPreviousData,
  })
}

export const featuredNftQueryOptions = () =>
  queryOptions({
    queryKey: nftQueryKeys.featured(),
    queryFn: ({ signal }) => getFeaturedNft(signal),
  })

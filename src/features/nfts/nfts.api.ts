import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { apiClient } from '@/lib/http/api-client'
import type {
  NftDetail,
  NftListFilters,
  NftListRequest,
  NftListResponse,
  NftSummary,
} from './nft.contracts'
import { serializeNftListRequest, toNftListRequest } from './nft-list-filters'

export const nftQueryKeys = {
  all: ['nfts'] as const,
  lists: () => [...nftQueryKeys.all, 'list'] as const,
  list: (request: NftListRequest) => [...nftQueryKeys.lists(), request] as const,
  featured: () => [...nftQueryKeys.all, 'featured'] as const,
  detail: (nftId: string) => [...nftQueryKeys.all, 'detail', nftId] as const,
  relatedLists: () => [...nftQueryKeys.all, 'related'] as const,
  related: (nftId: string) => [...nftQueryKeys.relatedLists(), nftId] as const,
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

export async function getNftDetail(nftId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<NftDetail>(`/nfts/${encodeURIComponent(nftId)}`, { signal })
  return data
}

export async function getRelatedNfts(nftId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<NftSummary[]>(
    `/nfts/${encodeURIComponent(nftId)}/related`,
    { signal },
  )
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

export const nftDetailQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: nftQueryKeys.detail(nftId),
    queryFn: ({ signal }) => getNftDetail(nftId, signal),
  })

export const relatedNftsQueryOptions = (nftId: string) =>
  queryOptions({
    queryKey: nftQueryKeys.related(nftId),
    queryFn: ({ signal }) => getRelatedNfts(nftId, signal),
  })

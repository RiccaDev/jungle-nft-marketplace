import { http, HttpResponse } from 'msw'
import type { NftListResponse, NftSummary } from '@/features/nfts/nft.contracts'
import {
  MAX_NFT_LIST_PAGE_SIZE,
  NFT_LIST_PAGE_SIZE,
  parseNftListFilters,
  toNftListRequest,
} from '@/features/nfts/nft-list-filters'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { parsePositiveInteger } from '@/lib/search-params/parse-search-value'
import { queryNftCatalog, toNftSummary } from '../catalog/query-nft-catalog'
import { CATALOG_REFERENCE_DATE } from '../fixtures/nft-catalog.fixtures'
import { applyNetworkConditions } from '../network/network-conditions'
import { findFeaturedNftRecord, listNftCatalogRecords } from '../state/nft-catalog.state'

function parsePageSize(searchParams: URLSearchParams) {
  const pageSize = parsePositiveInteger(searchParams.get('pageSize')) ?? NFT_LIST_PAGE_SIZE
  return Math.min(pageSize, MAX_NFT_LIST_PAGE_SIZE)
}

export const nftHandlers = [
  http.get<never, never, NftSummary | ApiErrorBody>(apiUrl('/nfts/featured'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse

    const featuredRecord = findFeaturedNftRecord()
    if (!featuredRecord) {
      return HttpResponse.json<ApiErrorBody>(
        { error: { code: 'NOT_FOUND', message: 'Nenhum NFT em destaque.' } },
        { status: 404 },
      )
    }
    return HttpResponse.json<NftSummary>(toNftSummary(featuredRecord))
  }),

  http.get(apiUrl('/nfts'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse

    const searchParams = new URL(request.url).searchParams
    const filters = parseNftListFilters(Object.fromEntries(searchParams))
    const listRequest = toNftListRequest(filters, parsePageSize(searchParams))

    return HttpResponse.json<NftListResponse>(
      queryNftCatalog(listNftCatalogRecords(), listRequest, CATALOG_REFERENCE_DATE),
    )
  }),
]

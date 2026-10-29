import { http, HttpResponse } from 'msw'
import type { NftDetail, NftListResponse, NftSummary } from '@/features/nfts/nft.contracts'
import {
  MAX_NFT_LIST_PAGE_SIZE,
  NFT_LIST_PAGE_SIZE,
  parseNftListFilters,
  toNftListRequest,
} from '@/features/nfts/nft-list-filters'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { parsePositiveInteger } from '@/lib/search-params/parse-search-value'
import {
  findRelatedNfts,
  queryNftCatalog,
  toNftDetail,
  toNftSummary,
} from '../catalog/query-nft-catalog'
import { CATALOG_REFERENCE_DATE } from '../fixtures/nft-catalog.fixtures'
import { applyNetworkConditions } from '../network/network-conditions'
import {
  findFeaturedNftRecord,
  findNftRecord,
  listNftCatalogRecords,
} from '../state/nft-catalog.state'

type NftParams = { nftId: string }

function nftNotFoundResponse() {
  return HttpResponse.json<ApiErrorBody>(
    { error: { code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' } },
    { status: 404 },
  )
}

function parsePageSize(searchParams: URLSearchParams) {
  const pageSize = parsePositiveInteger(searchParams.get('pageSize')) ?? NFT_LIST_PAGE_SIZE
  return Math.min(pageSize, MAX_NFT_LIST_PAGE_SIZE)
}

// `/nfts/featured` must be registered before `/nfts/:nftId` so it is not read as an id.
export const nftHandlers = [
  http.get<never, never, NftSummary | ApiErrorBody>(apiUrl('/nfts/featured'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse

    const featuredRecord = findFeaturedNftRecord()
    if (!featuredRecord) return nftNotFoundResponse()
    return HttpResponse.json(toNftSummary(featuredRecord))
  }),

  http.get<NftParams, never, NftDetail | ApiErrorBody>(
    apiUrl('/nfts/:nftId'),
    async ({ request, params }) => {
      const simulatedResponse = await applyNetworkConditions(request)
      if (simulatedResponse) return simulatedResponse

      const record = findNftRecord(params.nftId)
      if (!record) return nftNotFoundResponse()
      return HttpResponse.json(toNftDetail(record))
    },
  ),

  http.get<NftParams, never, NftSummary[] | ApiErrorBody>(
    apiUrl('/nfts/:nftId/related'),
    async ({ request, params }) => {
      const simulatedResponse = await applyNetworkConditions(request)
      if (simulatedResponse) return simulatedResponse

      const record = findNftRecord(params.nftId)
      if (!record) return nftNotFoundResponse()
      return HttpResponse.json(findRelatedNfts(listNftCatalogRecords(), record))
    },
  ),

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

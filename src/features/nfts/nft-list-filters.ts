import {
  parseEnumList,
  parseEnumValue,
  parseEthAmount,
  parsePositiveInteger,
  parseTrimmedString,
} from '@/lib/search-params/parse-search-value'
import {
  NFT_CATALOG_SEGMENTS,
  NFT_COLLECTION_IDS,
  NFT_NETWORK_IDS,
  NFT_SORT_OPTIONS,
  type NftListFilters,
  type NftListRequest,
} from './nft.contracts'

export const NFT_LIST_PAGE_SIZE = 9
export const MAX_NFT_LIST_PAGE_SIZE = 48

const DEFAULT_SEGMENT = 'all'
const DEFAULT_SORT = 'recently-listed'
const FIRST_PAGE = 1

// Shared by the router (URL search) and the MSW handler (API query): unknown or invalid
// values are dropped instead of failing, and defaults are omitted to keep URLs short.
export function parseNftListFilters(raw: Record<string, unknown>): NftListFilters {
  const segment = parseEnumValue(raw.segment, NFT_CATALOG_SEGMENTS)
  const sort = parseEnumValue(raw.sort, NFT_SORT_OPTIONS)
  const page = parsePositiveInteger(raw.page)

  return {
    search: parseTrimmedString(raw.search),
    collections: parseEnumList(raw.collections, NFT_COLLECTION_IDS),
    networks: parseEnumList(raw.networks, NFT_NETWORK_IDS),
    minPrice: parseEthAmount(raw.minPrice),
    maxPrice: parseEthAmount(raw.maxPrice),
    segment: segment === DEFAULT_SEGMENT ? undefined : segment,
    sort: sort === DEFAULT_SORT ? undefined : sort,
    page: page === FIRST_PAGE ? undefined : page,
  }
}

export function toNftListRequest(
  filters: NftListFilters,
  pageSize = NFT_LIST_PAGE_SIZE,
): NftListRequest {
  return {
    search: filters.search,
    collections: filters.collections,
    networks: filters.networks,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    segment: filters.segment ?? DEFAULT_SEGMENT,
    sort: filters.sort ?? DEFAULT_SORT,
    page: filters.page ?? FIRST_PAGE,
    pageSize,
  }
}

export function serializeNftListRequest(request: NftListRequest) {
  const params: Record<string, string> = {
    segment: request.segment,
    sort: request.sort,
    page: String(request.page),
    pageSize: String(request.pageSize),
  }
  if (request.search) params.search = request.search
  if (request.collections?.length) params.collections = request.collections.join(',')
  if (request.networks?.length) params.networks = request.networks.join(',')
  if (request.minPrice) params.minPrice = request.minPrice
  if (request.maxPrice) params.maxPrice = request.maxPrice
  return params
}

export function hasActiveNftFilters(filters: NftListFilters) {
  return Boolean(
    filters.search ||
      filters.collections?.length ||
      filters.networks?.length ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.segment,
  )
}

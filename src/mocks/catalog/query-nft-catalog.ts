import { compareEth } from '@/lib/eth/eth-amount'
import {
  NFT_COLLECTION_IDS,
  NFT_NETWORK_IDS,
  type FacetCount,
  type NftListRequest,
  type NftListResponse,
  type NftSortOption,
  type NftSummary,
} from '@/features/nfts/nft.contracts'
import type { NftCatalogRecord } from '../fixtures/nft-catalog.fixtures'

const NEW_RELEASE_WINDOW_MS = 14 * 24 * 60 * 60 * 1000
const TRENDING_MIN_SALES_LAST_7_DAYS = 25

type RecordPredicate = (record: NftCatalogRecord) => boolean

function normalizeText(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

function matchesSearch(search: string | undefined): RecordPredicate {
  if (!search) return () => true
  const normalizedSearch = normalizeText(search)
  return (record) => normalizeText(record.name).includes(normalizedSearch)
}

function matchesSegment(request: NftListRequest, referenceDate: Date): RecordPredicate {
  switch (request.segment) {
    case 'new-releases':
      return (record) =>
        referenceDate.getTime() - new Date(record.listedAt).getTime() <= NEW_RELEASE_WINDOW_MS
    case 'trending':
      return (record) => record.salesLast7Days >= TRENDING_MIN_SALES_LAST_7_DAYS
    case 'all':
      return () => true
  }
}

function matchesPriceRange({ minPrice, maxPrice }: NftListRequest): RecordPredicate {
  return (record) =>
    (!minPrice || compareEth(record.priceEth, minPrice) >= 0) &&
    (!maxPrice || compareEth(record.priceEth, maxPrice) <= 0)
}

function matchesCollections({ collections }: NftListRequest): RecordPredicate {
  return (record) => !collections?.length || collections.includes(record.collectionId)
}

function matchesNetworks({ networks }: NftListRequest): RecordPredicate {
  return (record) => !networks?.length || networks.includes(record.network)
}

function byMostRecentListing(left: NftCatalogRecord, right: NftCatalogRecord) {
  return right.listedAt.localeCompare(left.listedAt) || left.id.localeCompare(right.id)
}

const SORT_COMPARATORS: Record<
  NftSortOption,
  (left: NftCatalogRecord, right: NftCatalogRecord) => number
> = {
  'recently-listed': byMostRecentListing,
  'price-asc': (left, right) =>
    compareEth(left.priceEth, right.priceEth) || byMostRecentListing(left, right),
  'price-desc': (left, right) =>
    compareEth(right.priceEth, left.priceEth) || byMostRecentListing(left, right),
  'name-asc': (left, right) => left.name.localeCompare(right.name, 'pt-BR'),
}

function countBy<Id extends string>(
  records: readonly NftCatalogRecord[],
  ids: readonly Id[],
  getId: (record: NftCatalogRecord) => Id,
): FacetCount<Id>[] {
  return ids.map((id) => ({ id, count: records.filter((record) => getId(record) === id).length }))
}

function priceRangeOf(records: readonly NftCatalogRecord[]) {
  const sortedPrices = records.map((record) => record.priceEth).sort(compareEth)
  return { min: sortedPrices[0] ?? '0', max: sortedPrices.at(-1) ?? '0' }
}

export function toNftSummary({ salesLast7Days, ...summary }: NftCatalogRecord): NftSummary {
  return summary
}

// Facets are disjunctive: each dimension is counted with every other active filter applied,
// so selecting a collection does not zero the counts of the remaining collections.
export function queryNftCatalog(
  records: readonly NftCatalogRecord[],
  request: NftListRequest,
  referenceDate: Date,
): NftListResponse {
  const baseRecords = records
    .filter(matchesSearch(request.search))
    .filter(matchesSegment(request, referenceDate))
    .filter(matchesPriceRange(request))

  const matchingRecords = baseRecords
    .filter(matchesCollections(request))
    .filter(matchesNetworks(request))
    .sort(SORT_COMPARATORS[request.sort])

  const totalItems = matchingRecords.length
  const pageStart = (request.page - 1) * request.pageSize

  return {
    items: matchingRecords.slice(pageStart, pageStart + request.pageSize).map(toNftSummary),
    pagination: {
      page: request.page,
      pageSize: request.pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / request.pageSize)),
    },
    facets: {
      collections: countBy(
        baseRecords.filter(matchesNetworks(request)),
        NFT_COLLECTION_IDS,
        (record) => record.collectionId,
      ),
      networks: countBy(
        baseRecords.filter(matchesCollections(request)),
        NFT_NETWORK_IDS,
        (record) => record.network,
      ),
      priceRangeEth: priceRangeOf(records),
    },
  }
}

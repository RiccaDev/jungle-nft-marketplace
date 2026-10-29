export const NFT_COLLECTION_IDS = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'signatures',
  'utility',
] as const
export type NftCollectionId = (typeof NFT_COLLECTION_IDS)[number]

export const NFT_NETWORK_IDS = ['ethereum', 'polygon', 'solana'] as const
export type NftNetworkId = (typeof NFT_NETWORK_IDS)[number]

export const NFT_SORT_OPTIONS = ['recently-listed', 'price-asc', 'price-desc', 'name-asc'] as const
export type NftSortOption = (typeof NFT_SORT_OPTIONS)[number]

export const NFT_CATALOG_SEGMENTS = ['all', 'new-releases', 'trending'] as const
export type NftCatalogSegment = (typeof NFT_CATALOG_SEGMENTS)[number]

export const NFT_EDITION_TIERS = ['one-of-one', 'one-of-ten', 'one-of-fifty', 'open'] as const
export type NftEditionTier = (typeof NFT_EDITION_TIERS)[number]

export type NftRarity = 'rare'

export type NftImage = {
  src: string
  srcSet: string
  alt: string
}

export type NftSummary = {
  id: string
  name: string
  collectionId: NftCollectionId
  network: NftNetworkId
  priceEth: string
  previousPriceEth: string | null
  availableQuantity: number
  rarity: NftRarity | null
  image: NftImage
  listedAt: string
  version: number
}

export type NftEdition = {
  tier: NftEditionTier
  availableQuantity: number
  maxPerOrder: number
}

// Alternative framings of the same artwork; zoom and focus are percentages of the image.
export type NftGalleryView = {
  id: string
  label: string
  zoom: number
  focusX: number
  focusY: number
}

export type NftDetail = NftSummary & {
  tokenId: string
  seriesName: string
  creatorName: string
  royaltyPercent: number
  attributes: string[]
  summary: string
  description: string[]
  networkDescription: string
  contractAddress: string
  contractStandard: 'ERC-721'
  rating: {
    average: number
    reviewCount: number
  }
  editions: NftEdition[]
  gallery: NftGalleryView[]
}

export type NftListFilters = {
  search?: string
  collections?: NftCollectionId[]
  networks?: NftNetworkId[]
  minPrice?: string
  maxPrice?: string
  segment?: NftCatalogSegment
  sort?: NftSortOption
  page?: number
}

export type NftListRequest = Required<Pick<NftListFilters, 'segment' | 'sort' | 'page'>> &
  Omit<NftListFilters, 'segment' | 'sort' | 'page'> & {
    pageSize: number
  }

export type FacetCount<Id extends string> = {
  id: Id
  count: number
}

export type NftListResponse = {
  items: NftSummary[]
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  facets: {
    collections: FacetCount<NftCollectionId>[]
    networks: FacetCount<NftNetworkId>[]
    priceRangeEth: {
      min: string
      max: string
    }
  }
}

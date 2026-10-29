import { NFT_EDITION_TIERS, type NftEditionTier } from '@/features/nfts/nft.contracts'
import { parseEnumValue } from '@/lib/search-params/parse-search-value'

export type NftDetailSearch = {
  edition?: NftEditionTier
}

export function parseNftDetailSearch(raw: Record<string, unknown>): NftDetailSearch {
  return { edition: parseEnumValue(raw.edition, NFT_EDITION_TIERS) }
}

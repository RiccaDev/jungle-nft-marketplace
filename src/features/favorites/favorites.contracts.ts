import type { NftSummary } from '@/features/nfts/nft.contracts'

export type FavoritesResponse = {
  items: NftSummary[]
}

export type AddFavoriteRequest = {
  nftId: string
}

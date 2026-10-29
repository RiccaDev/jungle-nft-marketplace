import { createFileRoute } from '@tanstack/react-router'
import { NftDetailPage } from '@/features/nft-detail/nft-detail-page'
import { parseNftDetailSearch } from '@/features/nft-detail/nft-detail-search'
import { nftDetailQueryOptions } from '@/features/nfts/nfts.api'

export const Route = createFileRoute('/nfts/$nftId')({
  validateSearch: parseNftDetailSearch,
  // Starts the request early (also on link hover intent) without blocking the skeleton.
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(nftDetailQueryOptions(params.nftId))
  },
  component: NftDetailPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/home/home-page'
import { parseNftListFilters } from '@/features/nfts/nft-list-filters'

export const Route = createFileRoute('/')({
  validateSearch: parseNftListFilters,
  component: HomePage,
})

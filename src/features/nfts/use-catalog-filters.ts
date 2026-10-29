import { getRouteApi } from '@tanstack/react-router'
import type { NftListFilters } from './nft.contracts'

const homeRoute = getRouteApi('/')

export type CatalogFilterPatch = Omit<NftListFilters, 'page'>

export function useCatalogFilters() {
  const filters = homeRoute.useSearch()
  const navigate = homeRoute.useNavigate()

  function updateFilters(patch: CatalogFilterPatch) {
    void navigate({
      search: (previous) => ({ ...previous, ...patch, page: undefined }),
      resetScroll: false,
    })
  }

  function clearFilters() {
    void navigate({ search: {}, resetScroll: false })
  }

  return { filters, updateFilters, clearFilters }
}

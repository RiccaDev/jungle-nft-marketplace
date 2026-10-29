import { useQuery } from '@tanstack/react-query'
import { cn } from 'cn'
import { NFT_COLLECTION_IDS, NFT_NETWORK_IDS } from '../nft.contracts'
import { NFT_COLLECTION_LABELS, NFT_NETWORK_LABELS } from '../nft-labels'
import { nftListQueryOptions } from '../nfts.api'
import { useCatalogFilters } from '../use-catalog-filters'
import { FilterOptionList } from './filter-option-list'
import { PriceRangeFilter } from './price-range-filter'

export function CatalogFiltersPanel({ className }: { className?: string }) {
  const { filters, updateFilters } = useCatalogFilters()
  const { data } = useQuery(nftListQueryOptions(filters))
  const facets = data?.facets

  return (
    <div className={cn('flex flex-col gap-10 bg-surface-card p-5', className)}>
      <FilterOptionList
        title="Coleções"
        optionIds={NFT_COLLECTION_IDS}
        labels={NFT_COLLECTION_LABELS}
        selectedIds={filters.collections}
        facets={facets?.collections}
        onSelectionChange={(collections) => updateFilters({ collections })}
        isCountBold
      />
      <PriceRangeFilter
        bounds={facets?.priceRangeEth}
        minPrice={filters.minPrice}
        maxPrice={filters.maxPrice}
        onApply={updateFilters}
      />
      <FilterOptionList
        title="Rede"
        optionIds={NFT_NETWORK_IDS}
        labels={NFT_NETWORK_LABELS}
        selectedIds={filters.networks}
        facets={facets?.networks}
        onSelectionChange={(networks) => updateFilters({ networks })}
      />
    </div>
  )
}

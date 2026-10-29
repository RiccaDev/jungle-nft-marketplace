import { useId } from 'react'
import sortArrowDownIcon from '@/assets/figma/catalog/sort-arrow-down.svg'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NFT_SORT_OPTIONS, type NftSortOption } from '../nft.contracts'
import { NFT_SORT_LABELS } from '../nft-labels'
import { useCatalogFilters } from '../use-catalog-filters'

const DEFAULT_SORT: NftSortOption = 'recently-listed'

export function CatalogSortSelect() {
  const labelId = useId()
  const { filters, updateFilters } = useCatalogFilters()

  return (
    <div className="flex items-center gap-2 text-[15px] whitespace-nowrap">
      <span id={labelId}>Ordenar por:</span>
      <Select
        value={filters.sort ?? DEFAULT_SORT}
        onValueChange={(sort) => updateFilters({ sort: sort as NftSortOption })}
      >
        <SelectTrigger
          aria-labelledby={labelId}
          icon={<img src={sortArrowDownIcon} alt="" width={16} height={16} />}
          className="h-auto gap-2 border-0 p-0 text-[15px] text-foreground shadow-none dark:bg-transparent dark:hover:bg-transparent"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          {NFT_SORT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {NFT_SORT_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

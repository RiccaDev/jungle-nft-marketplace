import filterIcon from '@/assets/figma/mobile/filter.svg'
import searchIcon from '@/assets/figma/mobile/search.svg'
import { CatalogFiltersSheet } from '@/features/nfts/components/catalog-filters-sheet'
import { useCatalogSearchInput } from '@/features/nfts/use-catalog-search-input'

export function MobileCatalogSearchBar() {
  const { value, changeValue } = useCatalogSearchInput()

  return (
    <div className="flex h-[45px] gap-2">
      <div
        role="search"
        className="flex flex-1 items-center gap-2 rounded-[10px] bg-surface-card px-3 focus-within:ring-2 focus-within:ring-ring"
      >
        <img src={searchIcon} alt="" width={22} height={22} />
        <label htmlFor="mobile-catalog-search" className="sr-only">
          Buscar NFTs
        </label>
        <input
          id="mobile-catalog-search"
          type="search"
          value={value}
          onChange={(event) => changeValue(event.target.value)}
          placeholder="Explorar coleções"
          className="min-w-0 flex-1 bg-transparent text-sm leading-4 font-bold placeholder:text-brand-secondary focus:outline-none"
        />
      </div>
      <CatalogFiltersSheet
        trigger={
          <button
            type="button"
            aria-label="Filtros e ordenação"
            className="grid size-[45px] shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(137deg,rgba(210,138,76,0.45)_24.6%,rgb(210,138,76)_100%)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <img src={filterIcon} alt="" width={16} height={16} />
          </button>
        }
      />
    </div>
  )
}

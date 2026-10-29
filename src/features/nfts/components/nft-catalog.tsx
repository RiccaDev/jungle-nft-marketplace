import { SlidersHorizontalIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CatalogFiltersPanel } from './catalog-filters-panel'
import { CatalogFiltersSheet } from './catalog-filters-sheet'
import { CatalogResults } from './catalog-results'
import { CatalogSegmentTabs } from './catalog-segment-tabs'
import { CatalogSortSelect } from './catalog-sort-select'
import { FeaturedNftBanner } from './featured-nft-banner'

export function NftCatalog() {
  return (
    <section
      id="catalogo"
      aria-labelledby="catalog-title"
      className="page-container scroll-mt-6 md:mt-24"
    >
      <h2 id="catalog-title" className="sr-only">
        Catálogo de NFTs
      </h2>
      <div className="flex items-start gap-12">
        <aside aria-label="Filtros e destaque" className="hidden w-[260px] shrink-0 flex-col gap-6 lg:flex xl:w-[310px]">
          <CatalogFiltersPanel />
          <FeaturedNftBanner />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <CatalogSegmentTabs />
            <div className="flex items-center gap-4 max-md:hidden max-lg:w-full max-lg:justify-between">
              <CatalogFiltersSheet
                trigger={
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <SlidersHorizontalIcon aria-hidden="true" />
                    Filtros
                  </Button>
                }
              />
              <CatalogSortSelect />
            </div>
          </div>
          <CatalogResults />
        </div>
      </div>
    </section>
  )
}

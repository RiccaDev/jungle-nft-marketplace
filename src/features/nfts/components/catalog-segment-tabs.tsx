import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { NFT_CATALOG_SEGMENTS } from '../nft.contracts'
import { NFT_SEGMENT_LABELS } from '../nft-labels'
import { useCatalogFilters } from '../use-catalog-filters'

export function CatalogSegmentTabs() {
  const { filters } = useCatalogFilters()
  const activeSegment = filters.segment ?? 'all'

  return (
    <nav aria-label="Seções do catálogo" className="-mx-1 overflow-x-auto px-1 pb-1">
      <ul className="flex gap-4 text-sm leading-4 whitespace-nowrap md:gap-5 md:text-[15px] md:font-medium">
        {NFT_CATALOG_SEGMENTS.map((segment) => {
          const isActive = segment === activeSegment
          return (
            <li key={segment}>
              <Link
                to="/"
                search={(previous) => ({
                  ...previous,
                  segment: segment === 'all' ? undefined : segment,
                  page: undefined,
                })}
                resetScroll={false}
                activeOptions={{ exact: true }}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col gap-1 rounded-sm after:h-0.5 after:w-full after:content-[\'\'] hover:text-text-accent md:gap-[7px]',
                  isActive && 'font-bold text-text-accent after:bg-primary md:font-medium',
                )}
              >
                {NFT_SEGMENT_LABELS[segment]}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

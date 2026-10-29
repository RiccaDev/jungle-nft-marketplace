import { Skeleton } from '@/components/ui/skeleton'
import type { NftSummary } from '../nft.contracts'
import { NftCard } from './nft-card'

const ABOVE_THE_FOLD_CARD_COUNT = 3

// On mobile the right column is offset by 32px, reproducing the staggered grid of the design.
const GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-6 pb-8 md:grid-cols-3 md:gap-x-8 md:gap-y-[72px] md:pb-0 lg:grid-cols-2 xl:grid-cols-3 xl:gap-x-[34px]'
const GRID_ITEM_CLASS = 'max-md:even:translate-y-8'

export function NftGrid({ nfts }: { nfts: NftSummary[] }) {
  return (
    <ul className={GRID_CLASS}>
      {nfts.map((nft, index) => (
        <li key={nft.id} className={GRID_ITEM_CLASS}>
          <NftCard nft={nft} isAboveTheFold={index < ABOVE_THE_FOLD_CARD_COUNT} />
        </li>
      ))}
    </ul>
  )
}

export function NftGridSkeleton({ cardCount }: { cardCount: number }) {
  return (
    <ul className={GRID_CLASS} aria-hidden="true" data-testid="nft-grid-skeleton">
      {Array.from({ length: cardCount }, (_, index) => (
        <li key={index} className={GRID_ITEM_CLASS}>
          <div className="flex flex-col gap-2 md:gap-3">
            <Skeleton className="aspect-[175/200] rounded-[20px] md:aspect-[258/300] md:rounded-none" />
            <div className="flex flex-col gap-1.5 pl-2 md:pl-0">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

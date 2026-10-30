import { Link } from '@tanstack/react-router'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { formatEth } from '@/lib/eth/eth-amount'
import type { NftSummary } from '../nft.contracts'

const CARD_IMAGE_SIZES = '(min-width: 1280px) 250px, (min-width: 768px) 30vw, 45vw'

// Mobile and desktop frames style the card differently; both variants live in one element.
const ARTWORK_FRAME_CLASS =
  'relative flex aspect-[175/200] items-center justify-center overflow-hidden rounded-[20px] bg-[linear-gradient(139.5deg,var(--gm-surface-card)_12%,var(--gm-surface-raised)_106.6%)] p-1 md:aspect-[258/300] md:rounded-none md:bg-surface-card md:bg-none'

type NftCardProps = {
  nft: NftSummary
  isAboveTheFold?: boolean
}

export function NftCard({ nft, isAboveTheFold = false }: NftCardProps) {
  const isSoldOut = nft.availableQuantity === 0

  return (
    <article className="relative flex flex-col gap-2 rounded-[20px] has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-ring md:gap-3 md:rounded-none">
      <div className={ARTWORK_FRAME_CLASS}>
        <img
          src={nft.image.src}
          srcSet={nft.image.srcSet}
          sizes={CARD_IMAGE_SIZES}
          alt={nft.image.alt}
          width={480}
          height={480}
          loading={isAboveTheFold ? 'eager' : 'lazy'}
          decoding="async"
          className="aspect-square w-full rounded-2xl object-cover md:rounded-[15px]"
        />
        {nft.rarity === 'rare' && (
          <span className="absolute top-4 left-0 w-[68px] bg-primary px-2 py-2 text-[13px] leading-4 font-medium text-ink">
            RARO
          </span>
        )}
        <FavoriteButton nft={nft} variant="icon" className="absolute top-3 right-3" />
      </div>

      <div className="flex flex-col gap-1.5 pl-2 md:pl-0">
        <h3 className="text-[15px] leading-tight md:text-base md:leading-4">
          <Link
            to="/nfts/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {nft.name}
          </Link>
        </h3>
        <p className="flex flex-wrap items-center gap-x-3 text-base leading-4 md:text-lg">
          <span className="font-bold text-text-accent">
            <span className="sr-only">Preço: </span>
            <span data-testid="nft-price">{formatEth(nft.priceEth)}</span>
          </span>
          {nft.previousPriceEth && (
            <s className="text-brand-secondary">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.previousPriceEth)}
            </s>
          )}
        </p>
        {isSoldOut && <p className="text-sm text-muted-foreground">Esgotado</p>}
      </div>
    </article>
  )
}

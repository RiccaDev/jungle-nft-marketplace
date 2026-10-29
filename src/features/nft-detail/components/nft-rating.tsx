import starFilledIcon from '@/assets/figma/detail/star-filled.svg'
import starPartialIcon from '@/assets/figma/detail/star-partial.svg'
import mobileRatingStarIcon from '@/assets/figma/detail/mobile-rating-star.svg'
import type { NftDetail } from '@/features/nfts/nft.contracts'

const STAR_COUNT = 5

function formatRating(average: number) {
  return average.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function NftRating({ rating }: { rating: NftDetail['rating'] }) {
  const fullStars = Math.floor(rating.average)

  return (
    <p className="flex items-center gap-1 text-[15px]">
      <span className="sr-only">Nota {formatRating(rating.average)} de 5, </span>
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <img
          key={index}
          src={index < fullStars ? starFilledIcon : starPartialIcon}
          alt=""
          aria-hidden="true"
          width={15}
          height={15}
          className="p-[1.5px]"
        />
      ))}
      <span>{rating.reviewCount} avaliações de colecionadores</span>
    </p>
  )
}

export function NftRatingBadge({ rating }: { rating: NftDetail['rating'] }) {
  return (
    <p className="flex h-[27px] shrink-0 items-center gap-1 rounded-full border border-primary px-1.5 text-sm leading-4">
      <img src={mobileRatingStarIcon} alt="" aria-hidden="true" width={14} height={14} className="p-px" />
      <span className="font-medium">
        <span className="sr-only">Nota </span>
        {formatRating(rating.average)}
      </span>
      <span className="text-text-secondary">
        ({rating.reviewCount}
        <span className="sr-only"> avaliações</span>)
      </span>
    </p>
  )
}

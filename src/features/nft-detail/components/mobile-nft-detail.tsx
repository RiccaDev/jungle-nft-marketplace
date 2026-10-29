import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { useId } from 'react'
import mobileBackArrowIcon from '@/assets/figma/detail/mobile-back-arrow.svg'
import mobileCartIcon from '@/assets/figma/detail/mobile-cart.svg'
import mobileFavoriteIcon from '@/assets/figma/detail/mobile-favorite.svg'
import { formatEth } from '@/lib/eth/eth-amount'
import { AvailabilityStatus } from './availability-status'
import type { NftDetailLayoutProps } from './desktop-nft-detail'
import { EditionSelector } from './edition-selector'
import { NftDescriptionSection } from './nft-description-section'
import { NftGallery } from './nft-gallery'
import { NftRatingBadge } from './nft-rating'
import { NftTokenInfo } from './nft-token-info'
import { QuantityStepper } from './quantity-stepper'
import { RelatedNftsSection } from './related-nfts-section'
import { UnavailableActionButton } from './unavailable-action-button'

const ROUND_ICON_BUTTON_CLASS =
  'grid size-[35px] place-items-center rounded-full border border-border bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

function BackButton() {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()

  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (canGoBack ? router.history.back() : void navigate({ to: '/' }))}
      className={ROUND_ICON_BUTTON_CLASS}
    >
      <img src={mobileBackArrowIcon} alt="" width={13} height={7} className="rotate-90" />
    </button>
  )
}

export function MobileNftDetail({ nft, selection, actions, changeNotice }: NftDetailLayoutProps) {
  const reasonId = useId()
  const unavailableReasons = [actions.purchase, actions.favorite]
    .map((action) => (action.status === 'unavailable' ? action.reason : null))
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex flex-col">
      <div className="bg-[linear-gradient(137.6deg,var(--gm-surface-card)_12%,var(--gm-surface-raised)_106.6%)] px-7 pt-6 pb-[60px]">
        <div className="mb-2 flex items-center justify-between">
          <BackButton />
          <UnavailableActionButton reasonId={reasonId} label="Favoritar" className={ROUND_ICON_BUTTON_CLASS}>
            <img src={mobileFavoriteIcon} alt="" width={16} height={14} />
          </UnavailableActionButton>
        </div>
        <NftGallery nft={nft} variant="mobile" />
      </div>

      <div className="-mt-[30px] flex flex-col gap-3 rounded-t-[31px] bg-surface-card px-6 pt-8 pb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl leading-6 font-bold">{nft.name}</h1>
          <NftRatingBadge rating={nft.rating} />
        </div>
        <p className="text-sm leading-6 text-text-secondary">{nft.summary}</p>
        <EditionSelector
          editions={nft.editions}
          selectedTier={selection.selectedEditionTier}
          onSelect={selection.selectEdition}
        />
        <AvailabilityStatus nft={nft} selection={selection} changeNotice={changeNotice} />
        <NftTokenInfo nft={nft} />
      </div>

      <div className="page-container mt-12 flex flex-col gap-12">
        <NftDescriptionSection nft={nft} />
        <RelatedNftsSection nftId={nft.id} />
      </div>

      <div
        role="region"
        aria-label="Compra"
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-4 rounded-t-[40px] bg-surface-card px-6 pt-5 pb-6 shadow-[0_0_10px_rgba(10,6,4,0.45)]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-[15px] leading-4 font-medium text-text-secondary">
              Qtd.
            </span>
            <QuantityStepper
              size="compact"
              quantity={selection.quantity}
              maxQuantity={selection.maxQuantity}
              onDecrease={selection.decreaseQuantity}
              onIncrease={selection.increaseQuantity}
            />
          </div>
          <p className="text-xl leading-4 font-bold text-text-accent">
            <span className="sr-only">Preço: </span>
            <span data-testid="nft-detail-price">{formatEth(nft.priceEth)}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <UnavailableActionButton
            reasonId={reasonId}
            className="h-[60px] flex-1 rounded-[40px] bg-[linear-gradient(100.4deg,var(--gm-primary)_4%,rgb(210_138_76/0.8)_122%)] text-base leading-5 font-bold text-ink"
          >
            Comprar NFT
          </UnavailableActionButton>
          <UnavailableActionButton
            reasonId={reasonId}
            label="Adicionar ao carrinho"
            className="grid size-[60px] shrink-0 place-items-center rounded-[40px] border border-border bg-surface-raised"
          >
            <img src={mobileCartIcon} alt="" width={20} height={20} />
          </UnavailableActionButton>
        </div>
        <p id={reasonId} className="text-xs text-text-secondary">
          {unavailableReasons}
        </p>
      </div>
    </div>
  )
}

import { Link } from '@tanstack/react-router'
import { QuantityStepper } from '@/components/quantity-stepper'
import type { NftDetail } from '@/features/nfts/nft.contracts'
import { formatEth } from '@/lib/eth/eth-amount'
import type { NftActionState, NftCartActions } from '../nft-detail-actions'
import type { NftPurchaseSelectionState } from '../use-nft-purchase-selection'
import { AvailabilityStatus } from './availability-status'
import { CartLineStatus } from './cart-line-status'
import { EditionSelector } from './edition-selector'
import { NftDescriptionSection } from './nft-description-section'
import { NftGallery } from './nft-gallery'
import { NftPurchaseActions } from './nft-purchase-actions'
import { NftRating } from './nft-rating'
import { NftShareLinks } from './nft-share-links'
import { NftTokenInfo } from './nft-token-info'
import { RelatedNftsSection } from './related-nfts-section'

export type NftDetailLayoutProps = {
  nft: NftDetail
  selection: NftPurchaseSelectionState
  cart: NftCartActions
  favorite: NftActionState<(nftId: string) => void>
  changeNotice: string | null
}

function NftDetailBreadcrumb() {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex gap-1 text-[15px] leading-4 font-bold">
        <li>
          <Link to="/" className="hover:text-text-accent">
            Início
          </Link>
          <span aria-hidden="true"> /</span>
        </li>
        <li>
          <Link to="/" hash="catalogo" className="hover:text-text-accent">
            Mercado
          </Link>
        </li>
      </ol>
    </nav>
  )
}

export function DesktopNftDetail({ nft, selection, cart, favorite, changeNotice }: NftDetailLayoutProps) {
  return (
    <div className="page-container mt-8 flex flex-col gap-24">
      <div className="flex flex-col gap-3">
        <NftDetailBreadcrumb />
        <div className="flex flex-col gap-8 lg:flex-row">
          <NftGallery nft={nft} variant="desktop" />

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
            <div className="flex flex-col gap-3 border-b border-primary/40 pb-3">
              <h1 className="text-[28px] font-bold">{nft.name}</h1>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[22px] leading-4 font-bold text-text-accent">
                  <span className="sr-only">Preço: </span>
                  <span data-testid="nft-detail-price">{formatEth(nft.priceEth)}</span>
                </p>
                <NftRating rating={nft.rating} />
              </div>
            </div>

            <section aria-labelledby="nft-summary-title" className="flex flex-col gap-3">
              <h2 id="nft-summary-title" className="text-[15px] leading-4 font-bold">
                Sobre este NFT:
              </h2>
              <p className="text-sm leading-6 text-text-secondary">{nft.summary}</p>
            </section>

            <EditionSelector
              editions={nft.editions}
              selectedTier={selection.selectedEditionTier}
              onSelect={selection.selectEdition}
            />

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <QuantityStepper
                  size="large"
                  quantity={selection.quantity}
                  maxQuantity={selection.maxQuantity}
                  onDecrease={selection.decreaseQuantity}
                  onIncrease={selection.increaseQuantity}
                />
                <NftPurchaseActions cart={cart} favorite={favorite} canPurchase={selection.quantity > 0} />
              </div>
              <AvailabilityStatus nft={nft} selection={selection} changeNotice={changeNotice} />
              <CartLineStatus cart={cart} />
            </div>

            <div className="flex flex-col gap-3">
              <NftTokenInfo nft={nft} />
              <NftShareLinks nftName={nft.name} />
            </div>
          </div>
        </div>
      </div>

      <NftDescriptionSection nft={nft} />
      <RelatedNftsSection nftId={nft.id} />
    </div>
  )
}

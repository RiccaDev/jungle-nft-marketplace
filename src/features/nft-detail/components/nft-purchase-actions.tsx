import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import type { NftSummary } from '@/features/nfts/nft.contracts'
import type { NftCartActions } from '../nft-detail-actions'

type NftPurchaseActionsProps = {
  nft: NftSummary
  cart: NftCartActions
  canPurchase: boolean
}

export function NftPurchaseActions({ nft, cart, canPurchase }: NftPurchaseActionsProps) {
  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        onClick={cart.buyNow}
        disabled={!canPurchase || cart.isAdding}
        className="h-10 w-[130px] rounded-md bg-primary text-sm leading-5 font-bold text-ink hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {cart.isAdding ? 'ADICIONANDO…' : 'COMPRAR'}
      </button>
      <FavoriteButton nft={nft} variant="labeled" />
    </div>
  )
}

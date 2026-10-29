import { useId } from 'react'
import favoriteIcon from '@/assets/figma/detail/favorite.svg'
import type { NftActionState, NftCartActions } from '../nft-detail-actions'
import { UnavailableActionButton } from './unavailable-action-button'

type NftPurchaseActionsProps = {
  cart: NftCartActions
  favorite: NftActionState<(nftId: string) => void>
  canPurchase: boolean
}

export function NftPurchaseActions({ cart, favorite, canPurchase }: NftPurchaseActionsProps) {
  const reasonId = useId()

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={cart.buyNow}
          disabled={!canPurchase || cart.isAdding}
          className="h-10 w-[130px] rounded-md bg-primary text-sm leading-5 font-bold text-ink hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cart.isAdding ? 'ADICIONANDO…' : 'COMPRAR'}
        </button>
        <UnavailableActionButton
          reasonId={reasonId}
          className="flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border border-primary text-sm leading-5 font-medium text-text-accent"
        >
          <img src={favoriteIcon} alt="" width={20} height={20} />
          Favoritar
        </UnavailableActionButton>
      </div>
      {favorite.status === 'unavailable' && (
        <p id={reasonId} className="max-w-[268px] text-right text-xs text-text-secondary">
          {favorite.reason}
        </p>
      )}
    </div>
  )
}

import { useId } from 'react'
import favoriteIcon from '@/assets/figma/detail/favorite.svg'
import type { NftDetailActions } from '../nft-detail-actions'
import { UnavailableActionButton } from './unavailable-action-button'

function unavailableReasons(actions: NftDetailActions) {
  return [actions.purchase, actions.favorite]
    .map((action) => (action.status === 'unavailable' ? action.reason : null))
    .filter((reason): reason is string => reason !== null)
}

export function NftPurchaseActions({ actions }: { actions: NftDetailActions }) {
  const reasonId = useId()

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <UnavailableActionButton
          reasonId={reasonId}
          className="h-10 w-[130px] rounded-md bg-primary text-sm leading-5 font-bold text-ink"
        >
          COMPRAR
        </UnavailableActionButton>
        <UnavailableActionButton
          reasonId={reasonId}
          className="flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border border-primary text-sm leading-5 font-medium text-text-accent"
        >
          <img src={favoriteIcon} alt="" width={20} height={20} />
          Favoritar
        </UnavailableActionButton>
      </div>
      <p id={reasonId} className="max-w-[268px] text-right text-xs text-text-secondary">
        {unavailableReasons(actions).join(' ')}
      </p>
    </div>
  )
}

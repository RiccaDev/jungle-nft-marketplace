import type { NftDetail } from '@/features/nfts/nft.contracts'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'
import type { NftPurchaseSelectionState } from '../use-nft-purchase-selection'

type AvailabilityStatusProps = {
  nft: NftDetail
  selection: NftPurchaseSelectionState
  changeNotice: string | null
}

function describeAvailability(nft: NftDetail, selection: NftPurchaseSelectionState) {
  const { selectedEdition, maxQuantity } = selection
  if (nft.availableQuantity === 0) return 'Todas as edições deste NFT estão esgotadas.'
  if (!selectedEdition || selectedEdition.availableQuantity === 0) {
    return 'Esta edição está esgotada. Escolha outra edição.'
  }

  const available = selectedEdition.availableQuantity
  const availableText = `${available} ${available === 1 ? 'disponível' : 'disponíveis'} na edição ${NFT_EDITION_LABELS[selectedEdition.tier]}`
  return maxQuantity < available
    ? `${availableText} · máximo de ${maxQuantity} por pedido.`
    : `${availableText}.`
}

export function AvailabilityStatus({ nft, selection, changeNotice }: AvailabilityStatusProps) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p data-testid="nft-availability" className={selection.isEditionSoldOut ? 'font-bold text-text-accent' : 'text-text-secondary'}>
        {describeAvailability(nft, selection)}
      </p>
      <div role="status" aria-live="polite" data-testid="nft-change-notice" className="text-text-accent empty:hidden">
        {changeNotice}
        {selection.wasQuantityReduced &&
          ` Quantidade ajustada para ${selection.quantity} conforme o estoque atual.`}
      </div>
    </div>
  )
}

import type { NftDetail } from '@/features/nfts/nft.contracts'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'
import type { NftPurchaseSelectionState } from '../use-nft-purchase-selection'

type AvailabilityStatusProps = {
  nft: NftDetail
  selection: NftPurchaseSelectionState
  changeNotice: string | null
}

function describeAvailability(nft: NftDetail, selection: NftPurchaseSelectionState) {
  const { selectedEdition, quantityInCart, isCartLimitReached } = selection
  if (nft.availableQuantity === 0) return 'Todas as edições deste NFT estão esgotadas.'
  if (!selectedEdition || selectedEdition.availableQuantity === 0) {
    return 'Esta edição está esgotada. Escolha outra edição.'
  }
  if (isCartLimitReached) {
    return `Você já tem ${quantityInCart} desta edição no carrinho, o máximo permitido por pedido.`
  }

  const available = selectedEdition.availableQuantity
  const editionLabel = NFT_EDITION_LABELS[selectedEdition.tier]
  const availableText = `${available} ${available === 1 ? 'disponível' : 'disponíveis'} na edição ${editionLabel}`
  const limitText =
    selectedEdition.maxPerOrder < available ? ` · máximo de ${selectedEdition.maxPerOrder} por pedido` : ''
  const cartText = quantityInCart > 0 ? ` Você já tem ${quantityInCart} no carrinho.` : ''
  return `${availableText}${limitText}.${cartText}`
}

export function AvailabilityStatus({ nft, selection, changeNotice }: AvailabilityStatusProps) {
  const isBlocked = selection.isEditionSoldOut || selection.isCartLimitReached

  return (
    <div className="flex flex-col gap-1 text-sm">
      <p data-testid="nft-availability" className={isBlocked ? 'font-bold text-text-accent' : 'text-text-secondary'}>
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

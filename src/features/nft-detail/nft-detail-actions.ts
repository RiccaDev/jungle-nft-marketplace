import type { NftEditionTier } from '@/features/nfts/nft.contracts'

export type NftPurchaseSelection = {
  nftId: string
  editionTier: NftEditionTier
  quantity: number
}

export type NftActionState<Run extends (...args: never[]) => void> =
  | { status: 'available'; run: Run }
  | { status: 'unavailable'; reason: string }

export type NftDetailActions = {
  purchase: NftActionState<(selection: NftPurchaseSelection) => void>
  favorite: NftActionState<(nftId: string) => void>
}

// Integration point for the cart and favorites steps: both flows do not exist yet,
// so the actions are reported as unavailable instead of pretending to succeed.
export function useNftDetailActions(): NftDetailActions {
  return {
    purchase: {
      status: 'unavailable',
      reason: 'A compra será habilitada junto com o carrinho.',
    },
    favorite: {
      status: 'unavailable',
      reason: 'Favoritos exigem login, que ainda não está disponível.',
    },
  }
}

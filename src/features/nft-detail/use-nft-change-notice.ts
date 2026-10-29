import { useState } from 'react'
import type { NftDetail } from '@/features/nfts/nft.contracts'
import { formatEth } from '@/lib/eth/eth-amount'

type ObservedNftState = Pick<NftDetail, 'version' | 'priceEth' | 'availableQuantity'>

function describeChange(previous: ObservedNftState, current: ObservedNftState) {
  const changes: string[] = []
  if (previous.priceEth !== current.priceEth) {
    changes.push(`Preço atualizado de ${formatEth(previous.priceEth)} para ${formatEth(current.priceEth)}.`)
  }
  if (previous.availableQuantity !== current.availableQuantity) {
    changes.push(
      current.availableQuantity === 0
        ? 'Este NFT acabou de esgotar.'
        : `Disponibilidade atualizada: ${current.availableQuantity} unidades.`,
    )
  }
  return changes.join(' ') || null
}

// Announces changes that arrive while the page is open (realtime events or refetches).
export function useNftChangeNotice(nft: NftDetail) {
  const [observed, setObserved] = useState<ObservedNftState>(nft)
  const [notice, setNotice] = useState<string | null>(null)

  if (nft.version !== observed.version) {
    setObserved(nft)
    setNotice(describeChange(observed, nft))
  }

  return notice
}

import { useState } from 'react'
import { formatEth } from '@/lib/eth/eth-amount'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'
import type { Cart, CartItem } from './cart.contracts'

type ObservedLine = Pick<CartItem['nft'], 'version' | 'priceEth' | 'availableQuantity'>

const MAX_VISIBLE_NOTICES = 4

function snapshot(cart: Cart | undefined) {
  return new Map<string, ObservedLine>(
    (cart?.items ?? []).map((item) => [item.id, { ...item.nft }]),
  )
}

function describeLineChange(item: CartItem, previous: ObservedLine) {
  const label = `${item.nft.name} (${NFT_EDITION_LABELS[item.editionTier]})`
  const changes: string[] = []
  if (previous.priceEth !== item.nft.priceEth) {
    changes.push(`${label}: preço alterado de ${formatEth(previous.priceEth)} para ${formatEth(item.nft.priceEth)}.`)
  }
  if (previous.availableQuantity !== item.nft.availableQuantity) {
    changes.push(
      item.nft.availableQuantity === 0
        ? `${label}: edição esgotada.`
        : `${label}: restam ${item.nft.availableQuantity} unidades.`,
    )
  }
  return changes
}

// Compares each render with the previously observed prices/stock and keeps a short history.
export function useCartChangeNotices(cart: Cart | undefined) {
  const [observed, setObserved] = useState(() => snapshot(cart))
  const [notices, setNotices] = useState<string[]>([])

  const hasNewerVersion = (cart?.items ?? []).some((item) => {
    const previous = observed.get(item.id)
    return previous !== undefined && item.nft.version > previous.version
  })

  if (cart && (hasNewerVersion || cart.items.some((item) => !observed.has(item.id)))) {
    const newNotices = cart.items.flatMap((item) => {
      const previous = observed.get(item.id)
      return previous && item.nft.version > previous.version ? describeLineChange(item, previous) : []
    })
    setObserved(snapshot(cart))
    if (newNotices.length > 0) setNotices((current) => [...newNotices, ...current].slice(0, MAX_VISIBLE_NOTICES))
  }

  return { notices, dismissNotices: () => setNotices([]) }
}

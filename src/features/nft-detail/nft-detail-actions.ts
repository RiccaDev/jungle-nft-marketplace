import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { cartItemId } from '@/features/cart/cart.contracts'
import { useAddCartItem, useCart, useRemoveCartItem } from '@/features/cart/use-cart'
import type { NftEditionTier } from '@/features/nfts/nft.contracts'
import { readApiError } from '@/lib/http/api-error'

export type NftActionState<Run extends (...args: never[]) => void> =
  | { status: 'available'; run: Run }
  | { status: 'unavailable'; reason: string }

export type NftCartActions = {
  quantityInCart: number
  isAdding: boolean
  isRemoving: boolean
  errorMessage: string | null
  addedMessage: string | null
  buyNow: () => void
  addToCart: () => void
  removeFromCart: () => void
}

type UseNftDetailActionsOptions = {
  nftId: string
  editionTier: NftEditionTier | undefined
  quantity: number
  onAdded: () => void
}

const GENERIC_CART_ERROR = 'Não foi possível atualizar o carrinho. Tente novamente.'

export function useCartQuantityLookup(nftId: string) {
  const cart = useCart()
  return (tier: NftEditionTier) =>
    cart.data?.items.find((item) => item.id === cartItemId(nftId, tier))?.quantity ?? 0
}

export function useNftDetailActions({ nftId, editionTier, quantity, onAdded }: UseNftDetailActionsOptions) {
  const navigate = useNavigate()
  const getQuantityInCart = useCartQuantityLookup(nftId)
  const addMutation = useAddCartItem()
  const removeMutation = useRemoveCartItem()
  const [addedMessage, setAddedMessage] = useState<string | null>(null)
  const failedMutation = addMutation.error ?? removeMutation.error

  async function add({ goToCart }: { goToCart: boolean }) {
    if (!editionTier || quantity < 1) return
    setAddedMessage(null)
    try {
      await addMutation.mutateAsync({ nftId, editionTier, quantity })
    } catch {
      return
    }
    onAdded()
    if (goToCart) {
      await navigate({ to: '/carrinho' })
      return
    }
    setAddedMessage(quantity === 1 ? '1 unidade adicionada ao carrinho.' : `${quantity} unidades adicionadas ao carrinho.`)
  }

  const cart: NftCartActions = {
    quantityInCart: editionTier ? getQuantityInCart(editionTier) : 0,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    errorMessage: failedMutation ? (readApiError(failedMutation)?.message ?? GENERIC_CART_ERROR) : null,
    addedMessage,
    buyNow: () => void add({ goToCart: true }),
    addToCart: () => void add({ goToCart: false }),
    removeFromCart: () => {
      setAddedMessage(null)
      if (editionTier) removeMutation.mutate(cartItemId(nftId, editionTier))
    },
  }

  // Favorites still depend on a flow that does not exist yet.
  const favorite: NftActionState<(nftId: string) => void> = {
    status: 'unavailable',
    reason: 'Favoritos serão habilitados em uma próxima etapa.',
  }

  return { cart, favorite }
}

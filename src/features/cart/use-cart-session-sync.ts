import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSession } from '@/features/auth/use-auth'
import { cartQueryKey, mergeGuestCart } from './cart.api'
import type { MergeCartResponse } from './cart.contracts'
import { clearGuestCartId, readGuestCartId } from './guest-cart-storage'

function describeMerge({ mergedItemCount, adjustments }: MergeCartResponse) {
  if (mergedItemCount === 0) return null
  const adjustmentText = adjustments
    .map((adjustment) =>
      adjustment.quantity === 0
        ? ` ${adjustment.name} não foi incluído: a edição está esgotada.`
        : ` ${adjustment.name} foi limitado a ${adjustment.quantity} pelo limite da edição.`,
    )
    .join('')
  return `Os itens adicionados antes do login foram combinados com o carrinho da sua conta.${adjustmentText}`
}

// Mounted at the root: when a visitor signs in, their guest cart is merged into the account.
export function useCartSessionSync() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? null
  const [mergeNotice, setMergeNotice] = useState<string | null>(null)

  useEffect(() => {
    const guestCartId = readGuestCartId()
    if (!userId || !guestCartId) return

    void mergeGuestCart(guestCartId).then(async (response) => {
      clearGuestCartId()
      queryClient.removeQueries({ queryKey: cartQueryKey(null) })
      // A pre-merge GET of the account cart must not overwrite the merged result.
      await queryClient.cancelQueries({ queryKey: cartQueryKey(userId), exact: true })
      queryClient.setQueryData(cartQueryKey(userId), response.cart)
      setMergeNotice(describeMerge(response))
    })
  }, [queryClient, userId])

  return {
    mergeNotice: userId ? mergeNotice : null,
    dismissMergeNotice: () => setMergeNotice(null),
  }
}

import { readApiError } from '@/lib/http/api-error'
import type { CartItem } from './cart.contracts'
import { useRemoveCartItem, useUpdateCartItemQuantity } from './use-cart'

const GENERIC_LINE_ERROR = 'Não foi possível atualizar este item. Tente novamente.'

export function useCartLineActions(item: CartItem) {
  const updateQuantity = useUpdateCartItemQuantity()
  const removeItem = useRemoveCartItem()
  const failedMutation = updateQuantity.error ?? removeItem.error

  return {
    setQuantity: (quantity: number) => updateQuantity.mutate({ itemId: item.id, quantity }),
    remove: () => removeItem.mutate(item.id),
    isRemoving: removeItem.isPending,
    errorMessage: failedMutation ? (readApiError(failedMutation)?.message ?? GENERIC_LINE_ERROR) : null,
  }
}

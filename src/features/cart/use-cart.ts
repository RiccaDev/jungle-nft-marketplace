import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/use-auth'
import {
  addCartItem,
  applyCartCoupon,
  cartQueryKey,
  cartQueryOptions,
  cartQuoteQueryOptions,
  removeCartCoupon,
  removeCartItem,
  updateCartItemQuantity,
} from './cart.api'
import type { Cart } from './cart.contracts'
import { writeGuestCartId } from './guest-cart-storage'

// Waits for the session to resolve, so a guest request never runs for a signed-in user.
function useCartOwner() {
  const { status, user } = useSession()
  return { isResolved: status !== 'loading', userId: user?.id ?? null }
}

export function useCart() {
  const { isResolved, userId } = useCartOwner()
  return useQuery({ ...cartQueryOptions(userId), enabled: isResolved })
}

export function useCartQuote(cart: Cart | undefined) {
  const { userId } = useCartOwner()
  const hasItems = Boolean(cart && cart.items.length > 0)
  return useQuery({
    ...cartQuoteQueryOptions(userId, cart ?? { id: null, version: 0, items: [], couponCode: null }),
    enabled: hasItems,
  })
}

function useStoreCart() {
  const queryClient = useQueryClient()
  const { userId } = useCartOwner()

  return (cart: Cart) => {
    if (!userId && cart.id) writeGuestCartId(cart.id)
    queryClient.setQueryData(cartQueryKey(userId), cart)
  }
}

export function useAddCartItem() {
  const storeCart = useStoreCart()
  return useMutation({ mutationFn: addCartItem, onSuccess: storeCart })
}

export function useRemoveCartItem() {
  const storeCart = useStoreCart()
  return useMutation({ mutationFn: removeCartItem, onSuccess: storeCart })
}

export function useApplyCartCoupon() {
  const storeCart = useStoreCart()
  return useMutation({ mutationFn: applyCartCoupon, onSuccess: storeCart })
}

export function useRemoveCartCoupon() {
  const storeCart = useStoreCart()
  return useMutation({ mutationFn: removeCartCoupon, onSuccess: storeCart })
}

// Optimistic: the stepper reacts immediately and rolls back if the API rejects the change.
export function useUpdateCartItemQuantity() {
  const queryClient = useQueryClient()
  const { userId } = useCartOwner()
  const storeCart = useStoreCart()
  const queryKey = cartQueryKey(userId)

  return useMutation({
    mutationFn: updateCartItemQuantity,
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey, exact: true })
      const previousCart = queryClient.getQueryData<Cart>(queryKey)
      if (previousCart) {
        queryClient.setQueryData<Cart>(queryKey, {
          ...previousCart,
          items: previousCart.items.map((item) => (item.id === itemId ? { ...item, quantity } : item)),
        })
      }
      return { previousCart }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCart) queryClient.setQueryData(queryKey, context.previousCart)
    },
    onSuccess: storeCart,
  })
}

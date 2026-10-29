import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { useRef } from 'react'
import { cartQueryKey } from '@/features/cart/cart.api'
import {
  ORDER_ERROR_CODES,
  type CreateOrderRequest,
  type PendingOrderErrorBody,
} from '@/features/orders/order.contracts'
import { createOrder, orderQueryKeys } from '@/features/orders/orders.api'
import { WALLET_ERROR_CODES } from '@/features/wallets/wallet.contracts'
import { walletQueryKeys } from '@/features/wallets/wallets.api'
import { readApiError } from '@/lib/http/api-error'
import { clearPurchaseAttempt, resolvePurchaseAttemptKey } from './purchase-attempt-storage'

export type PlaceOrderFailure =
  // The order may or may not exist: retrying sends the same key and recovers it.
  | { kind: 'uncertain'; message: string }
  | { kind: 'quote-changed'; message: string }
  | { kind: 'order-pending'; message: string; orderId: string }
  | { kind: 'refused'; message: string }

const UNCERTAIN_MESSAGE =
  'Não recebemos a resposta do pedido a tempo. Tente novamente: a mesma tentativa será reenviada, sem criar outro pedido nem cobrar duas vezes.'

// A response below 500 is a definitive answer from the API; anything else leaves the outcome unknown.
function isDefinitiveAnswer(error: unknown) {
  return isAxiosError(error) && error.response !== undefined && error.response.status < 500
}

export function describePlaceOrderFailure(error: unknown): PlaceOrderFailure {
  if (!isDefinitiveAnswer(error)) return { kind: 'uncertain', message: UNCERTAIN_MESSAGE }

  const apiError = readApiError(error)
  const message = apiError?.message ?? 'Não foi possível criar o pedido.'
  switch (apiError?.code) {
    case ORDER_ERROR_CODES.quoteChanged:
    case ORDER_ERROR_CODES.cartNotPurchasable:
      return { kind: 'quote-changed', message }
    case ORDER_ERROR_CODES.orderPending: {
      const orderId = isAxiosError<PendingOrderErrorBody>(error) ? error.response?.data.orderId : undefined
      return orderId ? { kind: 'order-pending', message, orderId } : { kind: 'refused', message }
    }
    default:
      return { kind: 'refused', message }
  }
}

export function usePlaceOrder(userId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  // Blocks a second click that lands before React re-renders the disabled button.
  const isSubmittingRef = useRef(false)

  const mutation = useMutation({
    mutationFn: (request: CreateOrderRequest) => createOrder(request, resolvePurchaseAttemptKey(userId, request)),
    onSuccess: async (order) => {
      clearPurchaseAttempt(userId)
      queryClient.setQueryData(orderQueryKeys.detail(userId, order.id), order)
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists(userId) })
      await navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
    },
    onError: (error) => {
      if (!isDefinitiveAnswer(error)) return
      clearPurchaseAttempt(userId)

      // Re-read whatever the API said is out of date; the checkout then shows the differences.
      const code = readApiError(error)?.code
      if (code === ORDER_ERROR_CODES.quoteChanged || code === ORDER_ERROR_CODES.cartNotPurchasable || code === ORDER_ERROR_CODES.cartEmpty) {
        void queryClient.invalidateQueries({ queryKey: cartQueryKey(userId) })
      }
      if (code === WALLET_ERROR_CODES.notConnected) {
        void queryClient.invalidateQueries({ queryKey: walletQueryKeys.connection(userId) })
      }
      if (code === ORDER_ERROR_CODES.orderPending) {
        void queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists(userId) })
      }
    },
  })

  function placeOrder(request: CreateOrderRequest) {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    mutation.mutate(request, {
      onSettled: () => {
        isSubmittingRef.current = false
      },
    })
  }

  return {
    placeOrder,
    isPending: mutation.isPending,
    failure: mutation.isError ? describePlaceOrderFailure(mutation.error) : null,
    resetFailure: mutation.reset,
  }
}

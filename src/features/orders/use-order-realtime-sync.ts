import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSession } from '@/features/auth/use-auth'
import { cartQueryKey } from '@/features/cart/cart.api'
import type { OrderUpdatedEvent } from '@/lib/realtime/realtime-events'
import { realtimeSocket } from '@/lib/realtime/socket-client'
import { applyOrderUpdatedEvent } from './apply-order-updated-event'
import type { Order } from './order.contracts'
import { orderQueryKeys } from './orders.api'

// Mounted at the root. Subscribed per user: a session switch re-subscribes with the new id, and
// the server only delivers order.updated to connections authenticated as the order owner.
export function useOrderRealtimeSync() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const userId = user?.id ?? null

  useEffect(() => {
    if (!userId) return
    let hasConnectedBefore = realtimeSocket.connected

    function handleOrderUpdated(event: OrderUpdatedEvent) {
      if (!userId) return
      const detailKey = orderQueryKeys.detail(userId, event.orderId)
      const cachedOrder = queryClient.getQueryData<Order>(detailKey)
      const isNewer = !cachedOrder || event.version > cachedOrder.version
      if (!isNewer) return

      if (cachedOrder) queryClient.setQueryData(detailKey, applyOrderUpdatedEvent(cachedOrder, event))
      void queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists(userId) })
      // The API removed the purchased quantities from the cart when it confirmed the order.
      if (event.status === 'confirmed') void queryClient.invalidateQueries({ queryKey: cartQueryKey(userId) })
    }

    // Events emitted while disconnected are lost: active orders are re-read from REST.
    function handleConnect() {
      if (hasConnectedBefore && userId) {
        void queryClient.invalidateQueries({ queryKey: orderQueryKeys.all(userId) })
      }
      hasConnectedBefore = true
    }

    realtimeSocket.on('order.updated', handleOrderUpdated)
    realtimeSocket.on('connect', handleConnect)
    return () => {
      realtimeSocket.off('order.updated', handleOrderUpdated)
      realtimeSocket.off('connect', handleConnect)
    }
  }, [queryClient, userId])
}

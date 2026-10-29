import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import { realtimeSocket } from '@/lib/realtime/socket-client'
import { applyNftUpdatedToCart } from './apply-nft-updated-to-cart'
import { isCartQueryKey } from './cart.api'
import type { Cart } from './cart.contracts'

const cartQueriesFilter = { predicate: (query: { queryKey: readonly unknown[] }) => isCartQueryKey(query.queryKey) }

// The cart embeds price and stock per line: events patch it in place, which changes the
// cart fingerprint and makes the open page request a fresh quote.
export function useCartRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let hasConnectedBefore = realtimeSocket.connected

    function handleNftUpdated(event: NftUpdatedEvent) {
      queryClient.setQueriesData<Cart>(cartQueriesFilter, (cart) =>
        cart ? applyNftUpdatedToCart(cart, event) : cart,
      )
    }

    function handleConnect() {
      if (hasConnectedBefore) void queryClient.invalidateQueries(cartQueriesFilter)
      hasConnectedBefore = true
    }

    realtimeSocket.on('nft.updated', handleNftUpdated)
    realtimeSocket.on('connect', handleConnect)
    return () => {
      realtimeSocket.off('nft.updated', handleNftUpdated)
      realtimeSocket.off('connect', handleConnect)
    }
  }, [queryClient])
}

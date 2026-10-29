import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import { realtimeSocket } from '@/lib/realtime/socket-client'
import { applyEventToDetail, applyEventToSummary } from './apply-nft-updated-event'
import type { NftDetail, NftListResponse, NftSummary } from './nft.contracts'
import { nftQueryKeys } from './nfts.api'

// Single subscription for the whole app: every cached view of the NFT is patched in place.
export function useNftRealtimeSync() {
  const queryClient = useQueryClient()

  useEffect(() => {
    let hasConnectedBefore = realtimeSocket.connected

    function handleNftUpdated(event: NftUpdatedEvent) {
      queryClient.setQueryData<NftDetail>(nftQueryKeys.detail(event.nftId), (nft) =>
        nft ? applyEventToDetail(nft, event) : nft,
      )
      queryClient.setQueryData<NftSummary>(nftQueryKeys.featured(), (nft) =>
        nft ? applyEventToSummary(nft, event) : nft,
      )
      queryClient.setQueriesData<NftSummary[]>({ queryKey: nftQueryKeys.relatedLists() }, (nfts) =>
        nfts?.map((nft) => applyEventToSummary(nft, event)),
      )
      queryClient.setQueriesData<NftListResponse>({ queryKey: nftQueryKeys.lists() }, (list) =>
        list ? { ...list, items: list.items.map((nft) => applyEventToSummary(nft, event)) } : list,
      )
      // A new price can change filter and sort membership; lists refetch on their next use.
      void queryClient.invalidateQueries({ queryKey: nftQueryKeys.lists(), refetchType: 'none' })
    }

    // Events emitted while disconnected are lost, so REST is the source of truth after a reconnect.
    function handleConnect() {
      if (hasConnectedBefore) {
        void queryClient.invalidateQueries({ queryKey: nftQueryKeys.all })
      }
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

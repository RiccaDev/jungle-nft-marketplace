import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import { realtimeSocket } from '@/lib/realtime/socket-client'
import { applyNftUpdatedEvent, isNewerNftEvent } from './apply-nft-updated-event'
import { demoNftQueryKey, type DemoNft } from './demo-nft.api'

export function useDemoNftRealtimeSync() {
  const queryClient = useQueryClient()
  const [lastAppliedEvent, setLastAppliedEvent] = useState<NftUpdatedEvent | null>(null)

  useEffect(() => {
    let hasConnectedBefore = realtimeSocket.connected

    function handleNftUpdated(event: NftUpdatedEvent) {
      const currentNft = queryClient.getQueryData<DemoNft>(demoNftQueryKey)
      if (!currentNft || !isNewerNftEvent(currentNft, event)) return

      queryClient.setQueryData<DemoNft>(demoNftQueryKey, (nft) =>
        nft ? applyNftUpdatedEvent(nft, event) : nft,
      )
      setLastAppliedEvent(event)
    }

    // Events emitted while disconnected are lost, so REST is the source of truth after a reconnect.
    function handleConnect() {
      if (hasConnectedBefore) {
        void queryClient.invalidateQueries({ queryKey: demoNftQueryKey })
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

  return { lastAppliedEvent }
}

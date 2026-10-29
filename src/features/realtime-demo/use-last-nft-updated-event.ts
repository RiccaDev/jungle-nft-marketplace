import { useEffect, useState } from 'react'
import type { NftUpdatedEvent } from '@/lib/realtime/realtime-events'
import { realtimeSocket } from '@/lib/realtime/socket-client'

// Diagnostic only: shows which event arrived; cache updates belong to useNftRealtimeSync.
export function useLastNftUpdatedEvent(nftId: string | undefined) {
  const [lastEvent, setLastEvent] = useState<NftUpdatedEvent | null>(null)

  useEffect(() => {
    function handleNftUpdated(event: NftUpdatedEvent) {
      if (event.nftId === nftId) setLastEvent(event)
    }

    realtimeSocket.on('nft.updated', handleNftUpdated)
    return () => {
      realtimeSocket.off('nft.updated', handleNftUpdated)
    }
  }, [nftId])

  return lastEvent
}

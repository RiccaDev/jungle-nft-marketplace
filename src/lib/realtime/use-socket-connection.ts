import { useEffect, useSyncExternalStore } from 'react'
import { realtimeSocket } from './socket-client'

function subscribeToConnectionChanges(onChange: () => void) {
  realtimeSocket.on('connect', onChange)
  realtimeSocket.on('disconnect', onChange)
  return () => {
    realtimeSocket.off('connect', onChange)
    realtimeSocket.off('disconnect', onChange)
  }
}

function getIsConnected() {
  return realtimeSocket.connected
}

export function useSocketConnection() {
  useEffect(() => {
    realtimeSocket.connect()
    return () => {
      realtimeSocket.disconnect()
    }
  }, [])

  const isConnected = useSyncExternalStore(subscribeToConnectionChanges, getIsConnected)

  return {
    isConnected,
    connect: () => realtimeSocket.connect(),
    disconnect: () => realtimeSocket.disconnect(),
  }
}

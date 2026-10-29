import { io, type Socket } from 'socket.io-client'
import { readSessionToken } from '@/lib/http/session-token-storage'
import type { ClientToServerEvents, ServerToClientEvents } from './realtime-events'
import { SOCKET_PATH, SOCKET_URL } from './config'

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const realtimeSocket: RealtimeSocket = io(SOCKET_URL, {
  path: SOCKET_PATH,
  // The MSW Socket.IO binding only intercepts WebSocket; HTTP long-polling is not mocked.
  transports: ['websocket'],
  autoConnect: false,
  // Read on every handshake, so each connection is bound to the current session.
  auth: (sendAuth) => sendAuth({ token: readSessionToken() }),
})

// A new handshake drops every server-side subscription tied to the previous identity.
export function reconnectWithCurrentSession() {
  if (!realtimeSocket.active) return
  realtimeSocket.disconnect()
  realtimeSocket.connect()
}

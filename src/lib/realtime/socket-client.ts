import { io, type Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from './realtime-events'
import { SOCKET_PATH, SOCKET_URL } from './config'

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export const realtimeSocket: RealtimeSocket = io(SOCKET_URL, {
  path: SOCKET_PATH,
  // The MSW Socket.IO binding only intercepts WebSocket; HTTP long-polling is not mocked.
  transports: ['websocket'],
  autoConnect: false,
})

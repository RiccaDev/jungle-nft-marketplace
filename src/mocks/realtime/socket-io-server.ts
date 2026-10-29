import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import type { ServerToClientEvents } from '@/lib/realtime/realtime-events'
import { socketServerWebSocketUrl } from '@/lib/realtime/config'
import { lookupSession } from '../state/auth.state'

type SocketIoConnection = ReturnType<typeof toSocketIo>

type ConnectedClient = {
  socketIo: SocketIoConnection
  // Resolved from the handshake token; null for visitors and expired sessions.
  userId: string | null
}

// Must match the pingInterval announced by the binding's mocked handshake.
const ENGINE_IO_PING_INTERVAL_MS = 25_000
const ENGINE_IO_PING_PACKET = '2'
const SOCKET_IO_CONNECT_PACKET_PREFIX = '40'

const socketIoLink = ws.link(socketServerWebSocketUrl())
const connectedClients = new Map<SocketIoConnection, ConnectedClient>()
// Closes each open WebSocket, registered or not.
const connectionClosers = new Set<() => void>()
// While false, the simulated server drops every connection (see interruptRealtimeConnections).
let isAcceptingConnections = true

function isSocketIoConnectPacket(data: unknown): data is string {
  return typeof data === 'string' && data.startsWith(SOCKET_IO_CONNECT_PACKET_PREFIX)
}

function resolveHandshakeUserId(connectPacket: string) {
  try {
    const handshake = JSON.parse(connectPacket.slice(SOCKET_IO_CONNECT_PACKET_PREFIX.length)) as {
      token?: string | null
    }
    const lookup = lookupSession(handshake.token)
    return lookup.status === 'active' ? lookup.user.id : null
  } catch {
    return null
  }
}

export const socketIoHandler = socketIoLink.addEventListener('connection', (connection) => {
  if (!isAcceptingConnections) {
    connection.client.close()
    return
  }

  const socketIo = toSocketIo(connection)
  let heartbeat: ReturnType<typeof setInterval> | undefined
  const closeConnection = () => connection.client.close()
  connectionClosers.add(closeConnection)

  // A socket closed while still connecting reaches this handler already closed and never
  // emits "close", so a client is only registered once it sends the Socket.IO CONNECT packet.
  connection.client.addEventListener('message', (event) => {
    if (!isSocketIoConnectPacket(event.data) || connectedClients.has(socketIo)) return

    connectedClients.set(socketIo, { socketIo, userId: resolveHandshakeUserId(event.data) })
    // The binding does not send Engine.IO heartbeats; without them the client
    // drops the connection after pingInterval + pingTimeout.
    heartbeat = setInterval(
      () => connection.client.send(ENGINE_IO_PING_PACKET),
      ENGINE_IO_PING_INTERVAL_MS,
    )
  })

  connection.client.addEventListener('close', () => {
    clearInterval(heartbeat)
    connectedClients.delete(socketIo)
    connectionClosers.delete(closeConnection)
  })
})

export function emitToConnectedClients<EventName extends keyof ServerToClientEvents>(
  eventName: EventName,
  ...payload: Parameters<ServerToClientEvents[EventName]>
) {
  for (const { socketIo } of connectedClients.values()) {
    socketIo.client.emit(eventName, ...payload)
  }
}

// For private events (e.g. order updates): only connections authenticated as the user receive them.
export function emitToUser<EventName extends keyof ServerToClientEvents>(
  userId: string,
  eventName: EventName,
  ...payload: Parameters<ServerToClientEvents[EventName]>
) {
  for (const client of connectedClients.values()) {
    if (client.userId === userId) client.socketIo.client.emit(eventName, ...payload)
  }
}

// Simulates a server-side outage: open connections are closed and reconnection attempts are
// refused until resumed, so events emitted meanwhile are lost (the client must reconcile via REST).
export function interruptRealtimeConnections() {
  isAcceptingConnections = false
  for (const closeConnection of [...connectionClosers]) closeConnection()
}

export function resumeRealtimeConnections() {
  isAcceptingConnections = true
}

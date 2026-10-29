// Shared by the socket.io-client and the MSW WebSocket link so both resolve the same server.
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin

// MSW strips this default Socket.IO path before matching `ws.link` URLs,
// so the mock link targets the server origin and the path must stay the default.
export const SOCKET_PATH = '/socket.io/'

export function socketServerWebSocketUrl() {
  const serverUrl = new URL('/', SOCKET_URL)
  const isSecure = serverUrl.protocol === 'https:' || serverUrl.protocol === 'wss:'
  serverUrl.protocol = isSecure ? 'wss:' : 'ws:'
  return serverUrl.href
}

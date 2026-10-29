import { delay, http, HttpResponse } from 'msw'
import {
  PAYMENT_NETWORK_IDS,
  WALLET_ERROR_CODES,
  type ConnectWalletRequest,
  type WalletConnectionResponse,
  type WalletListResponse,
} from '@/features/wallets/wallet.contracts'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { resolveRequestSession } from '../auth/request-session'
import { applyNetworkConditions } from '../network/network-conditions'
import { getMockScenario } from '../state/scenario.state'
import {
  connectWallet,
  disconnectWallet,
  findUserWallet,
  findWalletConnection,
  listUserWallets,
} from '../state/wallet.state'

// Time the simulated wallet takes to answer a connection request.
const WALLET_PROMPT_DELAY_MS = 400

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message } }, { status })
}

async function readJsonBody<Body>(request: Request): Promise<Partial<Body>> {
  try {
    return (await request.json()) as Partial<Body>
  } catch {
    return {}
  }
}

async function prepareWalletRequest(request: Request) {
  const simulatedResponse = await applyNetworkConditions(request)
  if (simulatedResponse) return simulatedResponse
  return resolveRequestSession(request)
}

export const walletHandlers = [
  http.get(apiUrl('/me/wallets'), async ({ request }) => {
    const session = await prepareWalletRequest(request)
    if (session instanceof Response) return session
    return HttpResponse.json<WalletListResponse>({ wallets: listUserWallets(session.user.id) })
  }),

  http.get(apiUrl('/me/wallet-connection'), async ({ request }) => {
    const session = await prepareWalletRequest(request)
    if (session instanceof Response) return session
    return HttpResponse.json<WalletConnectionResponse>({ connection: findWalletConnection(session.user.id) })
  }),

  // Simulates the wallet's connection prompt; the answer comes from the active scenario.
  http.post(apiUrl('/me/wallet-connection'), async ({ request }) => {
    const session = await prepareWalletRequest(request)
    if (session instanceof Response) return session

    const body = await readJsonBody<ConnectWalletRequest>(request)
    const wallet = body.walletId ? findUserWallet(session.user.id, body.walletId) : undefined
    if (!wallet) return errorResponse(404, WALLET_ERROR_CODES.walletNotFound, 'Carteira não encontrada.')

    const network = PAYMENT_NETWORK_IDS.find((candidate) => candidate === body.network)
    if (!network || !wallet.networks.includes(network)) {
      return errorResponse(422, WALLET_ERROR_CODES.networkNotSupported, 'Esta carteira não opera na rede escolhida.')
    }

    await delay(WALLET_PROMPT_DELAY_MS)
    if (getMockScenario().walletConnection === 'reject') {
      return errorResponse(403, WALLET_ERROR_CODES.connectionRejected, 'A conexão foi recusada na carteira.')
    }
    return HttpResponse.json<WalletConnectionResponse>(
      { connection: connectWallet(session.user.id, wallet, network) },
      { status: 201 },
    )
  }),

  http.delete(apiUrl('/me/wallet-connection'), async ({ request }) => {
    const session = await prepareWalletRequest(request)
    if (session instanceof Response) return session
    disconnectWallet(session.user.id)
    return new HttpResponse(null, { status: 204 })
  }),
]

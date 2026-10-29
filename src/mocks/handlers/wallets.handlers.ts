import { delay, http, HttpResponse } from 'msw'
import { hasFieldErrors } from '@/features/auth/auth-validation'
import {
  MAX_WALLETS_PER_USER,
  PAYMENT_NETWORK_IDS,
  WALLET_ERROR_CODES,
  type ConnectWalletRequest,
  type CreateWalletRequest,
  type PaymentNetworkId,
  type UpdateWalletRequest,
  type WalletConnectionResponse,
  type WalletFormValues,
  type WalletListResponse,
} from '@/features/wallets/wallet.contracts'
import { validateWallet } from '@/features/wallets/wallet-validation'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { resolveRequestSession } from '../auth/request-session'
import {
  applyDelayAfterCommit,
  applyNetworkCondition,
  applyNetworkConditions,
  readNetworkCondition,
} from '../network/network-conditions'
import { settleDueOrders } from '../orders/settle-order'
import { findPendingUserOrder } from '../state/order.state'
import { getMockScenario } from '../state/scenario.state'
import {
  connectWallet,
  createWallet,
  disconnectWallet,
  findUserWallet,
  findWalletByAddress,
  findWalletConnection,
  listUserWallets,
  makeWalletPrimary,
  updateWallet,
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

function readWalletForm(body: Partial<WalletFormValues>): WalletFormValues {
  return {
    label: typeof body.label === 'string' ? body.label : '',
    address: typeof body.address === 'string' ? body.address : '',
    networks: Array.isArray(body.networks) ? (body.networks as PaymentNetworkId[]) : [],
  }
}

function walletValidationResponse(values: WalletFormValues, userId: string, editedWalletId?: string) {
  const fieldErrors = validateWallet(values)
  if (hasFieldErrors(fieldErrors)) {
    return HttpResponse.json<ApiErrorBody>(
      { error: { code: 'VALIDATION_FAILED', message: 'Revise os campos destacados.', fieldErrors } },
      { status: 422 },
    )
  }
  const sameAddress = findWalletByAddress(userId, values.address)
  if (sameAddress && sameAddress.id !== editedWalletId) {
    const message = 'Este endereço já está cadastrado em outra carteira sua.'
    return HttpResponse.json<ApiErrorBody>(
      { error: { code: WALLET_ERROR_CODES.addressTaken, message, fieldErrors: { address: message } } },
      { status: 409 },
    )
  }
  return undefined
}

function walletListResponse(userId: string, status = 200) {
  return HttpResponse.json<WalletListResponse>({ wallets: listUserWallets(userId) }, { status })
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
    return walletListResponse(session.user.id)
  }),

  // Mutations answer with the whole list: a new primary also changes the role of the other wallet.
  http.post(apiUrl('/me/wallets'), async ({ request }) => {
    const session = await prepareWalletRequest(request)
    if (session instanceof Response) return session
    const userId = session.user.id

    const body = await readJsonBody<CreateWalletRequest>(request)
    const values = readWalletForm(body)
    const invalidResponse = walletValidationResponse(values, userId)
    if (invalidResponse) return invalidResponse
    if (listUserWallets(userId).length >= MAX_WALLETS_PER_USER) {
      return errorResponse(409, WALLET_ERROR_CODES.limitReached, 'Você já tem uma carteira principal e uma secundária.')
    }
    const role = body.role === 'secondary' ? 'secondary' : 'primary'
    createWallet(userId, { ...values, role })
    return walletListResponse(userId, 201)
  }),

  http.patch<{ walletId: string }>(apiUrl('/me/wallets/:walletId'), async ({ request, params }) => {
    const condition = readNetworkCondition(request)
    const simulatedResponse = await applyNetworkCondition(condition)
    if (simulatedResponse) return simulatedResponse
    const session = resolveRequestSession(request)
    if (session instanceof Response) return session
    const userId = session.user.id

    if (!findUserWallet(userId, params.walletId)) {
      return errorResponse(404, WALLET_ERROR_CODES.walletNotFound, 'Carteira não encontrada.')
    }
    const values = readWalletForm(await readJsonBody<UpdateWalletRequest>(request))
    const invalidResponse = walletValidationResponse(values, userId, params.walletId)
    if (invalidResponse) return invalidResponse

    // The pending order keeps its own snapshot, but address and networks of the wallet that is
    // paying it must not change until the payment settles.
    settleDueOrders()
    if (findPendingUserOrder(userId)?.payment.walletId === params.walletId) {
      return errorResponse(
        409,
        WALLET_ERROR_CODES.inUseByPendingOrder,
        'Esta carteira está pagando um pedido pendente. Aguarde a confirmação para editá-la.',
      )
    }
    updateWallet(userId, params.walletId, values)
    await applyDelayAfterCommit(condition)
    return walletListResponse(userId)
  }),

  // Only roles change (no payment data), so it is allowed even during a pending order.
  http.post<{ walletId: string }>(apiUrl('/me/wallets/:walletId/make-primary'), async ({ request, params }) => {
    const session = await prepareWalletRequest(request)
    if (session instanceof Response) return session
    if (!findUserWallet(session.user.id, params.walletId)) {
      return errorResponse(404, WALLET_ERROR_CODES.walletNotFound, 'Carteira não encontrada.')
    }
    makeWalletPrimary(session.user.id, params.walletId)
    return walletListResponse(session.user.id)
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

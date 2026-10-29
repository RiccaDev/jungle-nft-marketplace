import { http, HttpResponse } from 'msw'
import { hasFieldErrors } from '@/features/auth/auth-validation'
import { validateBuyerDetails } from '@/features/checkout/checkout-validation'
import { diffExpectedQuotes, toExpectedQuote } from '@/features/orders/expected-quote'
import {
  IDEMPOTENCY_KEY_HEADER,
  ORDER_ERROR_CODES,
  type Order,
  type OrderListResponse,
  type PendingOrderErrorBody,
  type QuoteConflictErrorBody,
} from '@/features/orders/order.contracts'
import { WALLET_ERROR_CODES } from '@/features/wallets/wallet.contracts'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { resolveRequestSession } from '../auth/request-session'
import { quoteCart } from '../cart/quote-cart'
import { resolveCart } from '../cart/resolve-cart'
import {
  applyDelayAfterCommit,
  applyNetworkCondition,
  applyNetworkConditions,
  readNetworkCondition,
} from '../network/network-conditions'
import { buildPendingOrder, fingerprintCreateOrderRequest, parseCreateOrderRequest } from '../orders/create-order'
import { scheduleSettlement, settleDueOrders } from '../orders/settle-order'
import { reserveStock } from '../orders/stock-reservation'
import { findUserCart } from '../state/cart.state'
import {
  findOrderByIdempotencyKey,
  findPendingUserOrder,
  findUserOrder,
  insertOrder,
  listUserOrders,
  toPublicOrder,
} from '../state/order.state'
import { getMockScenario } from '../state/scenario.state'
import { findWalletConnection } from '../state/wallet.state'

// Client-generated keys (UUIDs in the app); anything printable and reasonably sized is accepted.
const IDEMPOTENCY_KEY_PATTERN = /^[\w-]{8,100}$/

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message } }, { status })
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export const orderHandlers = [
  // Idempotent creation: the same key and content always return the same order (201 the first
  // time, 200 afterwards), even after a timeout; the same key with other content is a conflict.
  http.post(apiUrl('/orders'), async ({ request }) => {
    const condition = readNetworkCondition(request)
    const simulatedResponse = await applyNetworkCondition(condition)
    if (simulatedResponse) return simulatedResponse
    const session = resolveRequestSession(request)
    if (session instanceof Response) return session
    const userId = session.user.id

    const idempotencyKey = request.headers.get(IDEMPOTENCY_KEY_HEADER)?.trim()
    if (!idempotencyKey || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return errorResponse(400, ORDER_ERROR_CODES.idempotencyKeyRequired, 'Envie uma chave de idempotência válida.')
    }
    const orderRequest = parseCreateOrderRequest(await readJsonBody(request))
    if (!orderRequest) {
      return errorResponse(422, 'VALIDATION_FAILED', 'Dados do pedido incompletos ou inválidos.')
    }
    const requestFingerprint = fingerprintCreateOrderRequest(orderRequest)

    // From here until the order is stored there is no `await`: a concurrent retry with the same
    // key can only run before (and create it) or after (and find it).
    settleDueOrders()
    const existingOrder = findOrderByIdempotencyKey(userId, idempotencyKey)
    if (existingOrder) {
      if (existingOrder.requestFingerprint !== requestFingerprint) {
        return errorResponse(
          409,
          ORDER_ERROR_CODES.idempotencyKeyReused,
          'Esta chave de idempotência já foi usada em outro pedido.',
        )
      }
      return HttpResponse.json<Order>(toPublicOrder(existingOrder), { status: 200 })
    }

    const fieldErrors = validateBuyerDetails(orderRequest.buyer)
    if (hasFieldErrors(fieldErrors)) {
      return HttpResponse.json<ApiErrorBody>(
        { error: { code: 'VALIDATION_FAILED', message: 'Revise os dados do comprador.', fieldErrors } },
        { status: 422 },
      )
    }

    const connection = findWalletConnection(userId)
    if (!connection || connection.id !== orderRequest.walletConnectionId) {
      return errorResponse(409, WALLET_ERROR_CODES.notConnected, 'Conecte a carteira novamente para pagar.')
    }

    const pendingOrder = findPendingUserOrder(userId)
    if (pendingOrder) {
      return HttpResponse.json<PendingOrderErrorBody>(
        {
          error: { code: ORDER_ERROR_CODES.orderPending, message: 'Há um pedido aguardando confirmação.' },
          orderId: pendingOrder.id,
        },
        { status: 409 },
      )
    }

    const cart = resolveCart(findUserCart(userId))
    if (cart.items.length === 0) return errorResponse(409, ORDER_ERROR_CODES.cartEmpty, 'O carrinho está vazio.')

    const now = new Date()
    const currentQuote = quoteCart(cart, now)
    if (currentQuote.lines.some((line) => line.issue !== null) || currentQuote.couponIssue !== null) {
      return HttpResponse.json<QuoteConflictErrorBody>(
        {
          error: {
            code: ORDER_ERROR_CODES.cartNotPurchasable,
            message: 'Alguns itens ou o cupom não estão mais disponíveis.',
          },
          currentQuote,
        },
        { status: 409 },
      )
    }
    if (diffExpectedQuotes(orderRequest.expectedQuote, toExpectedQuote(currentQuote)).length > 0) {
      return HttpResponse.json<QuoteConflictErrorBody>(
        {
          error: { code: ORDER_ERROR_CODES.quoteChanged, message: 'Os valores do pedido mudaram. Revise e confirme novamente.' },
          currentQuote,
        },
        { status: 409 },
      )
    }

    const order = insertOrder(
      buildPendingOrder({
        userId,
        idempotencyKey,
        requestFingerprint,
        request: orderRequest,
        cart,
        quote: currentQuote,
        connection,
        scenario: getMockScenario(),
        now,
      }),
    )
    reserveStock(order.lines)
    scheduleSettlement(order)

    await applyDelayAfterCommit(condition)
    return HttpResponse.json<Order>(toPublicOrder(order), { status: 201 })
  }),

  http.get(apiUrl('/orders'), async ({ request }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse
    const session = resolveRequestSession(request)
    if (session instanceof Response) return session

    settleDueOrders()
    const status = new URL(request.url).searchParams.get('status')
    const orders = listUserOrders(session.user.id).filter((order) => !status || order.status === status)
    return HttpResponse.json<OrderListResponse>({ orders: orders.map(toPublicOrder) })
  }),

  http.get<{ orderId: string }>(apiUrl('/orders/:orderId'), async ({ request, params }) => {
    const simulatedResponse = await applyNetworkConditions(request)
    if (simulatedResponse) return simulatedResponse
    const session = resolveRequestSession(request)
    if (session instanceof Response) return session

    settleDueOrders()
    const order = findUserOrder(session.user.id, params.orderId)
    if (!order) return errorResponse(404, ORDER_ERROR_CODES.orderNotFound, 'Pedido não encontrado.')
    return HttpResponse.json<Order>(toPublicOrder(order))
  }),
]

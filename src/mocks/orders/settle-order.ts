import { cartItemId } from '@/features/cart/cart.contracts'
import { ORDER_ERROR_CODES, type Order, type OrderLine } from '@/features/orders/order.contracts'
import type { PaymentNetworkId } from '@/features/wallets/wallet.contracts'
import type { OrderUpdatedEvent } from '@/lib/realtime/realtime-events'
import { emitToUser } from '../realtime/socket-io-server'
import { findUserCart, saveCart } from '../state/cart.state'
import {
  findOrder,
  listPendingOrders,
  replaceOrder,
  type StoredOrder,
} from '../state/order.state'
import { releaseStock } from './stock-reservation'

type SettlementOutcome = Exclude<Order['status'], 'pending'>

const EXPLORER_TX_URLS: Record<PaymentNetworkId, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
}

const settlementTimers = new Map<string, ReturnType<typeof setTimeout>>()

function randomTransactionHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
}

function toOrderUpdatedEvent(order: StoredOrder): OrderUpdatedEvent {
  return {
    eventId: `order.updated:${order.id}:${order.version}`,
    orderId: order.id,
    version: order.version,
    status: order.status,
    updatedAt: order.updatedAt,
    transaction: order.transaction,
    failure: order.failure,
    occurredAt: new Date().toISOString(),
  }
}

// Only the purchased quantities leave the cart: anything added meanwhile stays.
function removePurchasedQuantities(userId: string, lines: readonly OrderLine[]) {
  const cart = findUserCart(userId)
  if (!cart) return

  const items = cart.items
    .map((item) => {
      const purchased = lines.find((line) => line.itemId === cartItemId(item.nftId, item.editionTier))
      return purchased ? { ...item, quantity: item.quantity - purchased.quantity } : item
    })
    .filter((item) => item.quantity > 0)
  saveCart(cart, { items, couponCode: cart.couponCode })
}

// Terminal states are final: settling an order twice (timer + lazy read) has no effect.
export function settleOrder(orderId: string, outcome: SettlementOutcome) {
  const order = findOrder(orderId)
  if (!order || order.status !== 'pending') return undefined

  clearTimeout(settlementTimers.get(orderId))
  settlementTimers.delete(orderId)

  const transactionHash = randomTransactionHash()
  const settledOrder = replaceOrder({
    ...order,
    status: outcome,
    version: order.version + 1,
    updatedAt: new Date().toISOString(),
    settlesAt: null,
    transaction:
      outcome === 'confirmed'
        ? { hash: transactionHash, explorerUrl: `${EXPLORER_TX_URLS[order.payment.network]}${transactionHash}` }
        : null,
    failure:
      outcome === 'rejected'
        ? {
            code: ORDER_ERROR_CODES.paymentRejected,
            message: 'O pagamento foi recusado na carteira. Nenhum valor foi cobrado e os itens continuam no carrinho.',
          }
        : null,
  })

  if (outcome === 'confirmed') removePurchasedQuantities(order.userId, order.lines)
  else releaseStock(order.lines)

  emitToUser(order.userId, 'order.updated', toOrderUpdatedEvent(settledOrder))
  return settledOrder
}

export function scheduleSettlement(order: StoredOrder) {
  if (!order.settlesAt || !order.plannedOutcome) return
  const outcome = order.plannedOutcome
  const remainingMs = Math.max(0, new Date(order.settlesAt).getTime() - Date.now())
  settlementTimers.set(
    order.id,
    setTimeout(() => settleOrder(order.id, outcome), remainingMs),
  )
}

// Timers die with the page; reads settle overdue orders so a refresh never strands one as pending.
export function settleDueOrders(now = Date.now()) {
  for (const order of listPendingOrders()) {
    if (order.plannedOutcome && order.settlesAt && new Date(order.settlesAt).getTime() <= now) {
      settleOrder(order.id, order.plannedOutcome)
    }
  }
}

// On load: orders whose settlement time passed while the page was closed settle now, the
// others get their timers back.
settleDueOrders()
for (const order of listPendingOrders()) scheduleSettlement(order)

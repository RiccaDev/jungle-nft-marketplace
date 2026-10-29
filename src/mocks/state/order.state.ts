import type { Order, OrderStatus } from '@/features/orders/order.contracts'
import { loadMockState, saveMockState } from './mock-storage'

export type StoredOrder = Order & {
  userId: string
  // Idempotency: the same (user, key) always maps to this order; the fingerprint of the
  // original request detects a key reused with different content.
  idempotencyKey: string
  requestFingerprint: string
  // Settlement planned at creation from the active scenario; null waits for the control endpoint.
  plannedOutcome: Exclude<OrderStatus, 'pending'> | null
  settlesAt: string | null
}

// Persisted so a pending order can be recovered (and settled) after a refresh.
const STORAGE_NAME = 'orders:v1'
let orders = loadMockState<StoredOrder[]>(STORAGE_NAME, () => [])

function persistOrders() {
  saveMockState(STORAGE_NAME, orders)
}

export function toPublicOrder(order: StoredOrder): Order {
  const { userId, idempotencyKey, requestFingerprint, plannedOutcome, settlesAt, ...publicOrder } = order
  return publicOrder
}

export function listUserOrders(userId: string) {
  return orders
    .filter((order) => order.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

// Orders of other users are indistinguishable from missing ones.
export function findUserOrder(userId: string, orderId: string) {
  return orders.find((order) => order.id === orderId && order.userId === userId)
}

export function findOrder(orderId: string) {
  return orders.find((order) => order.id === orderId)
}

export function findOrderByIdempotencyKey(userId: string, idempotencyKey: string) {
  return orders.find((order) => order.userId === userId && order.idempotencyKey === idempotencyKey)
}

export function findPendingUserOrder(userId: string) {
  return orders.find((order) => order.userId === userId && order.status === 'pending')
}

export function listPendingOrders() {
  return orders.filter((order) => order.status === 'pending')
}

export function nextOrderNumber() {
  return `KR-${String(orders.length + 1).padStart(6, '0')}`
}

export function insertOrder(order: StoredOrder) {
  orders = [...orders, order]
  persistOrders()
  return order
}

export function replaceOrder(order: StoredOrder) {
  orders = orders.map((candidate) => (candidate.id === order.id ? order : candidate))
  persistOrders()
  return order
}

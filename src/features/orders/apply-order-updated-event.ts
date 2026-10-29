import type { OrderUpdatedEvent } from '@/lib/realtime/realtime-events'
import type { Order } from './order.contracts'

// Versions are monotonic per order: duplicates and late events never regress a newer state.
export function applyOrderUpdatedEvent(order: Order, event: OrderUpdatedEvent): Order {
  if (order.id !== event.orderId || event.version <= order.version) return order
  return {
    ...order,
    status: event.status,
    version: event.version,
    updatedAt: event.updatedAt,
    transaction: event.transaction,
    failure: event.failure,
  }
}

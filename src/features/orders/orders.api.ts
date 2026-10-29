import { queryOptions } from '@tanstack/react-query'
import { privateQueryKeys } from '@/features/auth/auth.api'
import { apiClient } from '@/lib/http/api-client'
import {
  IDEMPOTENCY_KEY_HEADER,
  type CreateOrderRequest,
  type Order,
  type OrderListResponse,
  type OrderStatus,
} from './order.contracts'

export const orderQueryKeys = {
  all: (userId: string) => [...privateQueryKeys.user(userId), 'orders'] as const,
  lists: (userId: string) => [...orderQueryKeys.all(userId), 'list'] as const,
  list: (userId: string, status: OrderStatus | 'all') => [...orderQueryKeys.lists(userId), status] as const,
  detail: (userId: string, orderId: string) => [...orderQueryKeys.all(userId), 'detail', orderId] as const,
}

// The key identifies the purchase attempt: retries of the same attempt reuse it, so the API
// returns the order it already created instead of creating another one.
export async function createOrder(request: CreateOrderRequest, idempotencyKey: string) {
  const { data } = await apiClient.post<Order>('/orders', request, {
    headers: { [IDEMPOTENCY_KEY_HEADER]: idempotencyKey },
  })
  return data
}

export async function getOrder(orderId: string, signal?: AbortSignal) {
  const { data } = await apiClient.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return data
}

export async function listOrders(status: OrderStatus | 'all', signal?: AbortSignal) {
  const { data } = await apiClient.get<OrderListResponse>('/orders', {
    signal,
    params: status === 'all' ? undefined : { status },
  })
  return data.orders
}

export const orderQueryOptions = (userId: string, orderId: string) =>
  queryOptions({
    queryKey: orderQueryKeys.detail(userId, orderId),
    queryFn: ({ signal }) => getOrder(orderId, signal),
    // Updates arrive through order.updated; REST is read on mount, refresh and reconnection.
    staleTime: 0,
  })

export const ordersQueryOptions = (userId: string, status: OrderStatus | 'all') =>
  queryOptions({
    queryKey: orderQueryKeys.list(userId, status),
    queryFn: ({ signal }) => listOrders(status, signal),
    staleTime: 0,
  })

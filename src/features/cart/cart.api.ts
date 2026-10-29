import { keepPreviousData, queryOptions, type QueryKey } from '@tanstack/react-query'
import { privateQueryKeys } from '@/features/auth/auth.api'
import { apiClient } from '@/lib/http/api-client'
import {
  GUEST_CART_HEADER,
  type AddCartItemRequest,
  type Cart,
  type CartQuote,
  type MergeCartResponse,
} from './cart.contracts'
import { readGuestCartId } from './guest-cart-storage'

const GUEST_CART_QUERY_KEY = ['guest-cart'] as const
const QUOTE_REFRESH_INTERVAL_MS = 60_000

// The account cart lives under the private prefix, so logout and user switches drop it.
export function cartQueryKey(userId: string | null): QueryKey {
  return userId ? [...privateQueryKeys.user(userId), 'cart'] : GUEST_CART_QUERY_KEY
}

// Matches cart entries only, not the quotes nested under the same prefix.
export function isCartQueryKey(queryKey: QueryKey) {
  const isGuestCart = queryKey.length === 1 && queryKey[0] === GUEST_CART_QUERY_KEY[0]
  const isAccountCart = queryKey.length === 3 && queryKey[0] === privateQueryKeys.all[0] && queryKey[2] === 'cart'
  return isGuestCart || isAccountCart
}

// Changes whenever the cart or any price/stock it depends on changes: a quote is only
// valid for the fingerprint it was computed with.
export function cartFingerprint(cart: Cart) {
  return [cart.version, ...cart.items.map((item) => `${item.id}@${item.nft.version}`)].join('|')
}

function guestCartHeaders() {
  const guestCartId = readGuestCartId()
  return guestCartId ? { [GUEST_CART_HEADER]: guestCartId } : {}
}

export async function getCart(signal?: AbortSignal) {
  const { data } = await apiClient.get<Cart>('/cart', { signal, headers: guestCartHeaders() })
  return data
}

export async function addCartItem(request: AddCartItemRequest) {
  const { data } = await apiClient.post<Cart>('/cart/items', request, { headers: guestCartHeaders() })
  return data
}

export async function updateCartItemQuantity({ itemId, quantity }: { itemId: string; quantity: number }) {
  const { data } = await apiClient.patch<Cart>(
    `/cart/items/${encodeURIComponent(itemId)}`,
    { quantity },
    { headers: guestCartHeaders() },
  )
  return data
}

export async function removeCartItem(itemId: string) {
  const { data } = await apiClient.delete<Cart>(`/cart/items/${encodeURIComponent(itemId)}`, {
    headers: guestCartHeaders(),
  })
  return data
}

export async function applyCartCoupon(code: string) {
  const { data } = await apiClient.put<Cart>('/cart/coupon', { code }, { headers: guestCartHeaders() })
  return data
}

export async function removeCartCoupon() {
  const { data } = await apiClient.delete<Cart>('/cart/coupon', { headers: guestCartHeaders() })
  return data
}

export async function quoteCart(signal?: AbortSignal) {
  const { data } = await apiClient.post<CartQuote>('/cart/quote', undefined, {
    signal,
    headers: guestCartHeaders(),
  })
  return data
}

export async function mergeGuestCart(guestCartId: string) {
  const { data } = await apiClient.post<MergeCartResponse>('/cart/merge', { guestCartId })
  return data
}

export const cartQueryOptions = (userId: string | null) =>
  queryOptions({
    queryKey: cartQueryKey(userId),
    queryFn: ({ signal }) => getCart(signal),
  })

export const cartQuoteQueryOptions = (userId: string | null, cart: Cart) =>
  queryOptions({
    queryKey: [...cartQueryKey(userId), 'quote', cartFingerprint(cart)],
    queryFn: ({ signal }) => quoteCart(signal),
    // The previous quote stays visible (marked as outdated) while the new one is computed.
    placeholderData: keepPreviousData,
    staleTime: QUOTE_REFRESH_INTERVAL_MS,
    refetchInterval: QUOTE_REFRESH_INTERVAL_MS,
  })

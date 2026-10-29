import { http, HttpResponse } from 'msw'
import { AUTH_ERROR_CODES } from '@/features/auth/auth.contracts'
import {
  CART_ERROR_CODES,
  GUEST_CART_HEADER,
  cartItemId,
  maxCartLineQuantity,
  type AddCartItemRequest,
  type Cart,
  type CartMergeAdjustment,
  type CartQuote,
  type MergeCartResponse,
} from '@/features/cart/cart.contracts'
import { NFT_EDITION_TIERS, type NftEditionTier } from '@/features/nfts/nft.contracts'
import { findEdition } from '@/features/nfts/nft-edition-selection'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { readBearerToken, unauthorizedResponse } from '../auth/request-session'
import { findCoupon, isCouponExpired, quoteCart } from '../cart/quote-cart'
import { resolveCart } from '../cart/resolve-cart'
import { applyNetworkConditions } from '../network/network-conditions'
import { lookupSession } from '../state/auth.state'
import {
  createCart,
  deleteCart,
  findGuestCart,
  findUserCart,
  saveCart,
  type StoredCart,
  type StoredCartItem,
} from '../state/cart.state'
import { findNftRecord } from '../state/nft-catalog.state'

type CartOwner = { kind: 'user'; userId: string } | { kind: 'guest'; cartId: string | null }

function errorResponse(status: number, code: string, message: string) {
  return HttpResponse.json<ApiErrorBody>({ error: { code, message } }, { status })
}

function resolveCartOwner(request: Request): CartOwner | Response {
  const token = readBearerToken(request)
  if (!token) return { kind: 'guest', cartId: request.headers.get(GUEST_CART_HEADER) }

  const lookup = lookupSession(token)
  if (lookup.status === 'active') return { kind: 'user', userId: lookup.user.id }
  return lookup.status === 'expired'
    ? unauthorizedResponse(AUTH_ERROR_CODES.sessionExpired, 'Sua sessão expirou.')
    : unauthorizedResponse(AUTH_ERROR_CODES.unauthenticated, 'É necessário entrar para continuar.')
}

function findOwnerCart(owner: CartOwner) {
  return owner.kind === 'user' ? findUserCart(owner.userId) : findGuestCart(owner.cartId)
}

function findOrCreateOwnerCart(owner: CartOwner) {
  return findOwnerCart(owner) ?? createCart(owner.kind === 'user' ? owner.userId : null)
}

function cartResponse(cart: StoredCart | undefined) {
  return HttpResponse.json<Cart>(resolveCart(cart))
}

function lineLimit(nftId: string, editionTier: NftEditionTier) {
  const edition = findEdition(findNftRecord(nftId)?.editions ?? [], editionTier)
  return edition ? maxCartLineQuantity(edition) : 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

async function readJsonBody<Body>(request: Request): Promise<Partial<Body>> {
  try {
    return (await request.json()) as Partial<Body>
  } catch {
    return {}
  }
}

// Shared preamble: simulated network conditions, then the cart owner (or the 401 response).
async function prepareCartRequest(request: Request) {
  const simulatedResponse = await applyNetworkConditions(request)
  if (simulatedResponse) return simulatedResponse
  return resolveCartOwner(request)
}

function quantityLimitResponse(limit: number, inCartQuantity: number) {
  const inCart = inCartQuantity > 0 ? ` Você já tem ${inCartQuantity} no carrinho.` : ''
  return errorResponse(
    409,
    CART_ERROR_CODES.quantityLimitExceeded,
    `Limite de ${limit} ${limit === 1 ? 'unidade' : 'unidades'} desta edição por pedido.${inCart}`,
  )
}

// Same NFT and edition in both carts keeps the larger quantity (never the sum), capped by stock.
function mergeItems(userItems: StoredCartItem[], guestItems: StoredCartItem[]) {
  const items = [...userItems]
  const adjustments: CartMergeAdjustment[] = []

  for (const guestItem of guestItems) {
    const existingIndex = items.findIndex(
      (item) => item.nftId === guestItem.nftId && item.editionTier === guestItem.editionTier,
    )
    const existing = items[existingIndex]
    const requestedQuantity = Math.max(existing?.quantity ?? 0, guestItem.quantity)
    const quantity = Math.min(requestedQuantity, lineLimit(guestItem.nftId, guestItem.editionTier))

    if (quantity < requestedQuantity) {
      adjustments.push({
        itemId: cartItemId(guestItem.nftId, guestItem.editionTier),
        name: findNftRecord(guestItem.nftId)?.name ?? guestItem.nftId,
        requestedQuantity,
        quantity,
      })
    }
    if (existing) {
      items[existingIndex] = { ...existing, quantity: quantity > 0 ? quantity : existing.quantity }
    } else if (quantity > 0) {
      items.push({ ...guestItem, quantity })
    }
  }
  return { items, adjustments }
}

export const cartHandlers = [
  http.get(apiUrl('/cart'), async ({ request }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner
    return cartResponse(findOwnerCart(owner))
  }),

  http.post(apiUrl('/cart/items'), async ({ request }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner

    const body = await readJsonBody<AddCartItemRequest>(request)
    const { quantity } = body
    const editionTier = NFT_EDITION_TIERS.find((tier) => tier === body.editionTier)
    if (!body.nftId || !editionTier || !isPositiveInteger(quantity)) {
      return errorResponse(422, 'VALIDATION_FAILED', 'Informe NFT, edição e uma quantidade inteira positiva.')
    }

    const nft = findNftRecord(body.nftId)
    const edition = nft && findEdition(nft.editions, editionTier)
    if (!nft || !edition) return errorResponse(404, 'NFT_NOT_FOUND', 'NFT não encontrado.')
    if (edition.availableQuantity === 0) {
      return errorResponse(409, CART_ERROR_CODES.editionSoldOut, 'Esta edição está esgotada.')
    }

    const cart = findOrCreateOwnerCart(owner)
    const existing = cart.items.find((item) => item.nftId === nft.id && item.editionTier === editionTier)
    const inCartQuantity = existing?.quantity ?? 0
    const limit = maxCartLineQuantity(edition)
    if (inCartQuantity + quantity > limit) return quantityLimitResponse(limit, inCartQuantity)

    const items = existing
      ? cart.items.map((item) => (item === existing ? { ...item, quantity: inCartQuantity + quantity } : item))
      : [...cart.items, { nftId: nft.id, editionTier, quantity, addedAt: new Date().toISOString() }]
    return cartResponse(saveCart(cart, { items, couponCode: cart.couponCode }))
  }),

  http.patch<{ itemId: string }>(apiUrl('/cart/items/:itemId'), async ({ request, params }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner

    const cart = findOwnerCart(owner)
    const item = cart?.items.find((candidate) => cartItemId(candidate.nftId, candidate.editionTier) === params.itemId)
    if (!cart || !item) {
      return errorResponse(404, CART_ERROR_CODES.itemNotFound, 'Item não encontrado no carrinho.')
    }

    const { quantity } = await readJsonBody<{ quantity: number }>(request)
    if (!isPositiveInteger(quantity)) {
      return errorResponse(422, 'VALIDATION_FAILED', 'A quantidade deve ser um número inteiro positivo.')
    }
    const limit = lineLimit(item.nftId, item.editionTier)
    if (quantity > limit) return quantityLimitResponse(limit, 0)

    const items = cart.items.map((candidate) => (candidate === item ? { ...candidate, quantity } : candidate))
    return cartResponse(saveCart(cart, { items, couponCode: cart.couponCode }))
  }),

  http.delete<{ itemId: string }>(apiUrl('/cart/items/:itemId'), async ({ request, params }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner

    const cart = findOwnerCart(owner)
    if (!cart) return cartResponse(undefined)
    const items = cart.items.filter((item) => cartItemId(item.nftId, item.editionTier) !== params.itemId)
    return cartResponse(saveCart(cart, { items, couponCode: cart.couponCode }))
  }),

  http.put(apiUrl('/cart/coupon'), async ({ request }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner

    const { code } = await readJsonBody<{ code: string }>(request)
    const coupon = code ? findCoupon(code) : undefined
    if (!coupon) return errorResponse(422, CART_ERROR_CODES.couponInvalid, 'Cupom inválido.')
    if (isCouponExpired(coupon, new Date())) {
      return errorResponse(422, CART_ERROR_CODES.couponExpired, 'Este cupom expirou.')
    }

    const cart = findOrCreateOwnerCart(owner)
    return cartResponse(saveCart(cart, { items: cart.items, couponCode: coupon.code }))
  }),

  http.delete(apiUrl('/cart/coupon'), async ({ request }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner

    const cart = findOwnerCart(owner)
    if (!cart) return cartResponse(undefined)
    return cartResponse(saveCart(cart, { items: cart.items, couponCode: null }))
  }),

  http.post(apiUrl('/cart/quote'), async ({ request }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner
    return HttpResponse.json<CartQuote>(quoteCart(resolveCart(findOwnerCart(owner)), new Date()))
  }),

  http.post(apiUrl('/cart/merge'), async ({ request }) => {
    const owner = await prepareCartRequest(request)
    if (owner instanceof Response) return owner
    if (owner.kind !== 'user') {
      return unauthorizedResponse(AUTH_ERROR_CODES.unauthenticated, 'É necessário entrar para continuar.')
    }

    const { guestCartId } = await readJsonBody<{ guestCartId: string }>(request)
    const guestCart = findGuestCart(guestCartId ?? null)
    const userCart = findOrCreateOwnerCart(owner)
    if (!guestCart) {
      return HttpResponse.json<MergeCartResponse>({
        cart: resolveCart(userCart),
        mergedItemCount: 0,
        adjustments: [],
      })
    }

    const { items, adjustments } = mergeItems(userCart.items, guestCart.items)
    const mergedCart = saveCart(userCart, { items, couponCode: userCart.couponCode ?? guestCart.couponCode })
    deleteCart(guestCart.id)
    return HttpResponse.json<MergeCartResponse>({
      cart: resolveCart(mergedCart),
      mergedItemCount: guestCart.items.length,
      adjustments,
    })
  }),
]

import type { NftEditionTier } from '@/features/nfts/nft.contracts'

export type StoredCartItem = {
  nftId: string
  editionTier: NftEditionTier
  quantity: number
  addedAt: string
}

export type StoredCart = {
  id: string
  ownerUserId: string | null
  version: number
  items: StoredCartItem[]
  couponCode: string | null
}

// Persisted so guest and account carts survive a page refresh.
const STORAGE_KEY = 'kurio-mock:carts:v1'

function loadCarts(): StoredCart[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as StoredCart[]
  } catch {
    // Corrupted or unavailable storage falls back to no carts.
  }
  return []
}

let carts = loadCarts()

function persistCarts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carts))
  } catch {
    // The in-memory state keeps working without storage.
  }
}

export function findGuestCart(cartId: string | null) {
  return cartId ? carts.find((cart) => cart.id === cartId && cart.ownerUserId === null) : undefined
}

export function findUserCart(userId: string) {
  return carts.find((cart) => cart.ownerUserId === userId)
}

export function createCart(ownerUserId: string | null): StoredCart {
  const cart = { id: crypto.randomUUID(), ownerUserId, version: 1, items: [], couponCode: null }
  carts.push(cart)
  persistCarts()
  return cart
}

export function saveCart(cart: StoredCart, changes: Pick<StoredCart, 'items' | 'couponCode'>) {
  const updatedCart = { ...cart, ...changes, version: cart.version + 1 }
  carts = carts.map((candidate) => (candidate.id === cart.id ? updatedCart : candidate))
  persistCarts()
  return updatedCart
}

export function deleteCart(cartId: string) {
  carts = carts.filter((cart) => cart.id !== cartId)
  persistCarts()
}

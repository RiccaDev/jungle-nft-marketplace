import type { CreateOrderRequest } from '@/features/orders/order.contracts'

type StoredAttempt = {
  idempotencyKey: string
  requestFingerprint: string
}

// Per user, so one account never reuses (or overwrites) the attempt of another.
function storageKey(userId: string) {
  return `kurio.purchase-attempt:${userId}`
}

// Mirrors the storage, so retries keep their key even when localStorage is unavailable.
const attemptsInMemory = new Map<string, StoredAttempt>()

function readAttempt(userId: string): StoredAttempt | null {
  const inMemory = attemptsInMemory.get(userId)
  if (inMemory) return inMemory
  try {
    const stored = localStorage.getItem(storageKey(userId))
    return stored ? (JSON.parse(stored) as StoredAttempt) : null
  } catch {
    return null
  }
}

// An attempt is "this exact request": while its outcome is unknown (timeout, network failure,
// 5xx, refresh), sending the same content reuses the key and the API returns the same order.
// Different content (new values accepted, another wallet) is a new attempt with a new key.
export function resolvePurchaseAttemptKey(userId: string, request: CreateOrderRequest) {
  const requestFingerprint = JSON.stringify(request)
  const stored = readAttempt(userId)
  if (stored?.requestFingerprint === requestFingerprint) return stored.idempotencyKey

  const attempt = { idempotencyKey: crypto.randomUUID(), requestFingerprint }
  attemptsInMemory.set(userId, attempt)
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(attempt))
  } catch {
    // Without storage the in-memory copy still protects retries until the page is reloaded.
  }
  return attempt.idempotencyKey
}

// Called once the API gave a definitive answer (order returned or request refused).
export function clearPurchaseAttempt(userId: string) {
  attemptsInMemory.delete(userId)
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

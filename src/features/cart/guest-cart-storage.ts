const GUEST_CART_ID_KEY = 'kurio.guest-cart-id'

export function readGuestCartId() {
  try {
    return localStorage.getItem(GUEST_CART_ID_KEY)
  } catch {
    return null
  }
}

export function writeGuestCartId(cartId: string) {
  try {
    localStorage.setItem(GUEST_CART_ID_KEY, cartId)
  } catch {
    // Without storage the guest cart lives until the page is reloaded.
  }
}

export function clearGuestCartId() {
  try {
    localStorage.removeItem(GUEST_CART_ID_KEY)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

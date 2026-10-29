// Mock-only credential storage: salted SHA-256 keeps plain passwords out of the simulated
// database. A real backend must use a slow, memory-hard hash such as Argon2 or bcrypt.
function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(password: string, salt: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`))
  return toHex(digest)
}

export function createSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(8)).buffer)
}

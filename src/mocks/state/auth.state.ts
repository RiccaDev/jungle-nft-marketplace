import type { AccountResponse, AuthUser } from '@/features/auth/auth.contracts'
import { normalizeEmail } from '@/features/auth/auth-validation'
import { createSalt, hashPassword } from '../auth/password-hashing'
import { FIXTURE_USERS, type MockUserRecord } from '../fixtures/user.fixtures'

type MockSessionRecord = {
  token: string
  userId: string
  expiresAt: string
}

type PersistedAuthState = {
  registeredUsers: MockUserRecord[]
  sessions: MockSessionRecord[]
}

export type SessionLookup =
  | { status: 'active'; session: MockSessionRecord; user: MockUserRecord }
  | { status: 'expired' }
  | { status: 'missing' }

// Persisted so sessions survive a page refresh (allowed by the challenge for the mock layer).
const STORAGE_KEY = 'kurio-mock:auth:v1'
const SESSION_TTL_MS = 30 * 60 * 1000

function loadPersistedState(): PersistedAuthState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored) as PersistedAuthState
  } catch {
    // Corrupted or unavailable storage falls back to a clean state.
  }
  return { registeredUsers: [], sessions: [] }
}

const state = loadPersistedState()

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // The in-memory state keeps working without storage.
  }
}

function allUsers() {
  return [...FIXTURE_USERS, ...state.registeredUsers]
}

export function toAuthUser({ id, username, email, displayName }: MockUserRecord): AuthUser {
  return { id, username, email, displayName }
}

export function toAccount(user: MockUserRecord): AccountResponse {
  return { ...toAuthUser(user), memberSince: user.memberSince }
}

export function findUserByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email)
  return allUsers().find((user) => user.email === normalizedEmail)
}

export function findUserByUsername(username: string) {
  const normalizedUsername = username.trim().toLowerCase()
  return allUsers().find((user) => user.username.toLowerCase() === normalizedUsername)
}

export async function verifyCredentials(email: string, password: string) {
  const user = findUserByEmail(email)
  if (!user) return undefined
  const passwordHash = await hashPassword(password, user.passwordSalt)
  return passwordHash === user.passwordHash ? user : undefined
}

export async function createUser(input: { username: string; email: string; password: string }) {
  const passwordSalt = createSalt()
  const username = input.username.trim()
  const user: MockUserRecord = {
    id: `user-${crypto.randomUUID()}`,
    username,
    email: normalizeEmail(input.email),
    displayName: username,
    memberSince: new Date().toISOString(),
    passwordSalt,
    passwordHash: await hashPassword(input.password, passwordSalt),
  }
  state.registeredUsers.push(user)
  persistState()
  return user
}

export function createSession(userId: string): MockSessionRecord {
  const session = {
    token: crypto.randomUUID(),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  }
  state.sessions.push(session)
  persistState()
  return session
}

export function lookupSession(token: string | null | undefined): SessionLookup {
  const session = token ? state.sessions.find((candidate) => candidate.token === token) : undefined
  if (!session) return { status: 'missing' }
  if (new Date(session.expiresAt).getTime() <= Date.now()) return { status: 'expired' }

  const user = allUsers().find((candidate) => candidate.id === session.userId)
  return user ? { status: 'active', session, user } : { status: 'missing' }
}

export function revokeSession(token: string) {
  state.sessions = state.sessions.filter((session) => session.token !== token)
  persistState()
}

export function expireSession(token: string) {
  const session = state.sessions.find((candidate) => candidate.token === token)
  if (!session) return false
  session.expiresAt = new Date(Date.now() - 1000).toISOString()
  persistState()
  return true
}

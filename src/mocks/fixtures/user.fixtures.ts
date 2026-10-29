import type { AccountResponse } from '@/features/auth/auth.contracts'

export type MockUserRecord = AccountResponse & {
  passwordSalt: string
  passwordHash: string
}

// Fictitious accounts. Only salted hashes are stored; the plain test passwords are
// documented in the README.
export const FIXTURE_USERS: MockUserRecord[] = [
  {
    id: 'user-ana',
    username: 'ana.colecionadora',
    email: 'ana@kurio.dev',
    displayName: 'Ana Ribeiro',
    memberSince: '2025-03-14T12:00:00.000Z',
    passwordSalt: 'b7e4c1a9d2f06e35',
    passwordHash: '9423fd9cb97b19b54fd978b429e9210266e220eee5e2cec6e11a489daeba49c4',
  },
  {
    id: 'user-bruno',
    username: 'bruno.criador',
    email: 'bruno@kurio.dev',
    displayName: 'Bruno Tavares',
    memberSince: '2025-08-02T12:00:00.000Z',
    passwordSalt: '5c09e2f7a1b34d68',
    passwordHash: '5ed599ffe35f782cdc603b49e75eda75e47774098e75d9b073b855320cac6938',
  },
]

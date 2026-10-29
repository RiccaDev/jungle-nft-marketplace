import type { PaymentNetworkId, Wallet, WalletConnection } from '@/features/wallets/wallet.contracts'
import { FIXTURE_WALLETS } from '../fixtures/wallet.fixtures'
import { loadMockState, saveMockState } from './mock-storage'

// One active connection per user, persisted so it survives a refresh during checkout.
const STORAGE_NAME = 'wallet-connections:v1'
const connections = loadMockState<Record<string, WalletConnection>>(STORAGE_NAME, () => ({}))

function persistConnections() {
  saveMockState(STORAGE_NAME, connections)
}

// Deterministic demo address derived from the user id, for accounts created by sign-up.
function demoAddress(userId: string) {
  let hex = ''
  for (let index = 0; hex.length < 40; index += 1) {
    hex += (userId.charCodeAt(index % userId.length) * (index + 7)).toString(16)
  }
  return `0x${hex.slice(0, 40)}`
}

// Accounts created by sign-up get a demo primary wallet until wallet registration exists.
export function listUserWallets(userId: string): Wallet[] {
  return (
    FIXTURE_WALLETS[userId] ?? [
      {
        id: `wallet-${userId}-primary`,
        label: 'Carteira principal (demo)',
        role: 'primary',
        address: demoAddress(userId),
        networks: ['ethereum', 'polygon'],
      },
    ]
  )
}

export function findUserWallet(userId: string, walletId: string) {
  return listUserWallets(userId).find((wallet) => wallet.id === walletId)
}

export function findWalletConnection(userId: string): WalletConnection | null {
  return connections[userId] ?? null
}

export function connectWallet(userId: string, wallet: Wallet, network: PaymentNetworkId) {
  const connection: WalletConnection = {
    id: crypto.randomUUID(),
    walletId: wallet.id,
    walletLabel: wallet.label,
    address: wallet.address,
    network,
    connectedAt: new Date().toISOString(),
  }
  connections[userId] = connection
  persistConnections()
  return connection
}

export function disconnectWallet(userId: string) {
  delete connections[userId]
  persistConnections()
}

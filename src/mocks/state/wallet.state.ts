import type {
  CreateWalletRequest,
  PaymentNetworkId,
  UpdateWalletRequest,
  Wallet,
  WalletConnection,
} from '@/features/wallets/wallet.contracts'
import { PAYMENT_NETWORK_IDS } from '@/features/wallets/wallet.contracts'
import { normalizeWalletAddress } from '@/features/wallets/wallet-validation'
import { FIXTURE_WALLETS } from '../fixtures/wallet.fixtures'
import { loadMockState, saveMockState } from './mock-storage'

// Registered wallets per user. Fixture users are seeded on first access; accounts created by
// sign-up start without wallets.
const WALLETS_STORAGE_NAME = 'wallets:v1'
const walletsByUser = loadMockState<Record<string, Wallet[]>>(WALLETS_STORAGE_NAME, () => ({}))

// One active connection per user, persisted so it survives a refresh during checkout.
const CONNECTIONS_STORAGE_NAME = 'wallet-connections:v1'
const connections = loadMockState<Record<string, WalletConnection>>(CONNECTIONS_STORAGE_NAME, () => ({}))

function persistWallets() {
  saveMockState(WALLETS_STORAGE_NAME, walletsByUser)
}

function persistConnections() {
  saveMockState(CONNECTIONS_STORAGE_NAME, connections)
}

// Primary first, so the checkout preselects it.
function sortByRole(wallets: Wallet[]) {
  return [...wallets].sort((left, right) => Number(left.role === 'secondary') - Number(right.role === 'secondary'))
}

function orderedNetworks(networks: readonly PaymentNetworkId[]) {
  return PAYMENT_NETWORK_IDS.filter((network) => networks.includes(network))
}

export function listUserWallets(userId: string): Wallet[] {
  return sortByRole(walletsByUser[userId] ?? FIXTURE_WALLETS[userId] ?? [])
}

function saveUserWallets(userId: string, wallets: Wallet[]) {
  walletsByUser[userId] = sortByRole(wallets)
  persistWallets()
  return walletsByUser[userId]
}

export function findUserWallet(userId: string, walletId: string) {
  return listUserWallets(userId).find((wallet) => wallet.id === walletId)
}

export function findWalletByAddress(userId: string, address: string) {
  const normalizedAddress = normalizeWalletAddress(address)
  return listUserWallets(userId).find((wallet) => normalizeWalletAddress(wallet.address) === normalizedAddress)
}

// A new primary demotes the current one, so there is never more than one primary.
export function createWallet(userId: string, request: CreateWalletRequest) {
  const wallets = listUserWallets(userId)
  const role = wallets.length === 0 ? 'primary' : request.role
  const wallet: Wallet = {
    id: `wallet-${crypto.randomUUID()}`,
    label: request.label.trim(),
    role,
    address: request.address.trim(),
    networks: orderedNetworks(request.networks),
  }
  const otherWallets = wallets.map((candidate) =>
    role === 'primary' ? { ...candidate, role: 'secondary' as const } : candidate,
  )
  return saveUserWallets(userId, [...otherWallets, wallet])
}

export function updateWallet(userId: string, walletId: string, request: UpdateWalletRequest) {
  const wallets = listUserWallets(userId).map((wallet) =>
    wallet.id === walletId
      ? {
          ...wallet,
          label: request.label.trim(),
          address: request.address.trim(),
          networks: orderedNetworks(request.networks),
        }
      : wallet,
  )
  // The connection snapshot (address, network) would be stale: the buyer must reconnect.
  if (connections[userId]?.walletId === walletId) disconnectWallet(userId)
  return saveUserWallets(userId, wallets)
}

export function makeWalletPrimary(userId: string, walletId: string) {
  const wallets = listUserWallets(userId).map((wallet) => ({
    ...wallet,
    role: wallet.id === walletId ? ('primary' as const) : ('secondary' as const),
  }))
  return saveUserWallets(userId, wallets)
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

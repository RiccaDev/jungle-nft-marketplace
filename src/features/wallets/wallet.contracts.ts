// Networks the marketplace settles payments on (ETH or bridged ETH).
export const PAYMENT_NETWORK_IDS = ['ethereum', 'polygon'] as const
export type PaymentNetworkId = (typeof PAYMENT_NETWORK_IDS)[number]

export const PAYMENT_NETWORK_LABELS: Record<PaymentNetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
}

export type Wallet = {
  id: string
  label: string
  role: 'primary' | 'secondary'
  address: string
  networks: PaymentNetworkId[]
}

export type WalletConnection = {
  id: string
  walletId: string
  walletLabel: string
  address: string
  network: PaymentNetworkId
  connectedAt: string
}

export type WalletListResponse = { wallets: Wallet[] }
export type WalletConnectionResponse = { connection: WalletConnection | null }

export type ConnectWalletRequest = {
  walletId: string
  network: PaymentNetworkId
}

export const WALLET_ERROR_CODES = {
  walletNotFound: 'WALLET_NOT_FOUND',
  networkNotSupported: 'NETWORK_NOT_SUPPORTED',
  connectionRejected: 'WALLET_CONNECTION_REJECTED',
  notConnected: 'WALLET_NOT_CONNECTED',
} as const

// "0x9f3a…c41e": enough to recognise the wallet without exposing the whole address.
export function shortenAddress(address: string) {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

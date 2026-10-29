import { queryOptions } from '@tanstack/react-query'
import { privateQueryKeys } from '@/features/auth/auth.api'
import { apiClient } from '@/lib/http/api-client'
import type {
  ConnectWalletRequest,
  WalletConnectionResponse,
  WalletListResponse,
} from './wallet.contracts'

export const walletQueryKeys = {
  wallets: (userId: string) => [...privateQueryKeys.user(userId), 'wallets'] as const,
  connection: (userId: string) => [...privateQueryKeys.user(userId), 'wallet-connection'] as const,
}

export async function getWallets(signal?: AbortSignal) {
  const { data } = await apiClient.get<WalletListResponse>('/me/wallets', { signal })
  return data.wallets
}

export async function getWalletConnection(signal?: AbortSignal) {
  const { data } = await apiClient.get<WalletConnectionResponse>('/me/wallet-connection', { signal })
  return data.connection
}

export async function connectWallet(request: ConnectWalletRequest) {
  const { data } = await apiClient.post<WalletConnectionResponse>('/me/wallet-connection', request)
  return data.connection
}

export async function disconnectWallet() {
  await apiClient.delete('/me/wallet-connection')
}

export const walletsQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: walletQueryKeys.wallets(userId),
    queryFn: ({ signal }) => getWallets(signal),
  })

export const walletConnectionQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: walletQueryKeys.connection(userId),
    queryFn: ({ signal }) => getWalletConnection(signal),
  })

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { connectWallet, disconnectWallet, walletConnectionQueryOptions, walletQueryKeys } from './wallets.api'

// The connection lives in the (simulated) wallet provider; the cache only mirrors its answers.
export function useWalletConnection(userId: string) {
  const queryClient = useQueryClient()
  const connection = useQuery(walletConnectionQueryOptions(userId))
  const queryKey = walletQueryKeys.connection(userId)

  const connect = useMutation({
    mutationFn: connectWallet,
    onSuccess: (newConnection) => queryClient.setQueryData(queryKey, newConnection),
  })

  const disconnect = useMutation({
    mutationFn: disconnectWallet,
    onSuccess: () => queryClient.setQueryData(queryKey, null),
  })

  return { connection, connect, disconnect }
}

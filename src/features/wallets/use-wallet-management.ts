import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isCurrentSessionUser } from '@/features/auth/session-cache'
import type { Wallet } from './wallet.contracts'
import { createWallet, makeWalletPrimary, updateWallet, walletQueryKeys } from './wallets.api'

// Every mutation answers with the full list (a new primary also demotes the other wallet).
// Responses that arrive after a session switch are dropped instead of written to any cache.
function useStoreWallets(userId: string) {
  const queryClient = useQueryClient()
  return (wallets: Wallet[]) => {
    if (!isCurrentSessionUser(queryClient, userId)) return
    queryClient.setQueryData(walletQueryKeys.wallets(userId), wallets)
    // Editing the connected wallet disconnects it on the server; the checkout must re-read it.
    void queryClient.invalidateQueries({ queryKey: walletQueryKeys.connection(userId) })
  }
}

export function useCreateWallet(userId: string) {
  const storeWallets = useStoreWallets(userId)
  return useMutation({ mutationFn: createWallet, onSuccess: storeWallets })
}

export function useUpdateWallet(userId: string) {
  const storeWallets = useStoreWallets(userId)
  return useMutation({ mutationFn: updateWallet, onSuccess: storeWallets })
}

export function useMakeWalletPrimary(userId: string) {
  const storeWallets = useStoreWallets(userId)
  return useMutation({ mutationFn: makeWalletPrimary, onSuccess: storeWallets })
}

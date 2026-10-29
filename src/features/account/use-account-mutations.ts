import { useMutation, useQueryClient } from '@tanstack/react-query'
import { accountQueryOptions } from '@/features/auth/auth.api'
import type { AccountResponse } from '@/features/auth/auth.contracts'
import { isCurrentSessionUser, updateSessionUser } from '@/features/auth/session-cache'
import { changePassword, removeAvatar, updateAvatar, updateProfile } from './account.api'

// The API answer is the only source of the new values: account and session caches (and so
// the header) are written from it, never from what was typed.
function useStoreAccount(userId: string) {
  const queryClient = useQueryClient()
  return (account: AccountResponse) => {
    if (!isCurrentSessionUser(queryClient, userId)) return
    const { id, username, email, displayName } = account
    queryClient.setQueryData(accountQueryOptions(userId).queryKey, account)
    updateSessionUser(queryClient, { id, username, email, displayName })
  }
}

export function useUpdateProfile(userId: string) {
  const storeAccount = useStoreAccount(userId)
  return useMutation({ mutationFn: updateProfile, onSuccess: storeAccount })
}

export function useUpdateAvatar(userId: string) {
  const storeAccount = useStoreAccount(userId)
  return useMutation({ mutationFn: updateAvatar, onSuccess: storeAccount })
}

export function useRemoveAvatar(userId: string) {
  const storeAccount = useStoreAccount(userId)
  return useMutation({ mutationFn: removeAvatar, onSuccess: storeAccount })
}

export function useChangePassword() {
  return useMutation({ mutationFn: changePassword })
}

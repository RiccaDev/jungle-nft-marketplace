import type { AccountResponse } from '@/features/auth/auth.contracts'
import { apiClient } from '@/lib/http/api-client'
import type { ChangePasswordRequest, UpdateAvatarRequest, UpdateProfileRequest } from './account.contracts'

export async function updateProfile(request: UpdateProfileRequest) {
  const { data } = await apiClient.patch<AccountResponse>('/me/account', request)
  return data
}

export async function updateAvatar(request: UpdateAvatarRequest) {
  const { data } = await apiClient.put<AccountResponse>('/me/avatar', request)
  return data
}

export async function removeAvatar() {
  const { data } = await apiClient.delete<AccountResponse>('/me/avatar')
  return data
}

export async function changePassword(request: ChangePasswordRequest) {
  await apiClient.put('/me/password', request)
}

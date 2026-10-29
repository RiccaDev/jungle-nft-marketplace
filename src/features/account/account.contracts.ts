export type UpdateProfileRequest = {
  displayName: string
  username: string
  email: string
}

export type ChangePasswordRequest = {
  currentPassword: string
  newPassword: string
}

export type ChangePasswordFormValues = ChangePasswordRequest & {
  newPasswordConfirmation: string
}

export type UpdateAvatarRequest = {
  // data:image/png|jpeg|webp;base64,…
  dataUrl: string
}

export const ACCOUNT_ERROR_CODES = {
  invalidCurrentPassword: 'INVALID_CURRENT_PASSWORD',
  avatarInvalid: 'AVATAR_INVALID',
} as const

export const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number]
// Kept small because the simulated API persists the image in localStorage.
export const AVATAR_MAX_BYTES = 512 * 1024

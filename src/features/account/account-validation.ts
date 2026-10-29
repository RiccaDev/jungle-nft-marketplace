import {
  validateEmail,
  validateNewPassword,
  validateUsername,
  withoutEmptyEntries,
  type FieldErrors,
} from '@/features/auth/auth-validation'
import {
  AVATAR_MAX_BYTES,
  AVATAR_MIME_TYPES,
  type ChangePasswordFormValues,
  type ChangePasswordRequest,
  type UpdateProfileRequest,
} from './account.contracts'

const DISPLAY_NAME_MIN_LENGTH = 2
const DISPLAY_NAME_MAX_LENGTH = 40

// Shared by the profile forms and the MSW handlers, so client and API reject the same input.
export function validateProfile(values: UpdateProfileRequest): FieldErrors<UpdateProfileRequest> {
  const displayName = values.displayName.trim()
  return withoutEmptyEntries({
    displayName: !displayName
      ? 'Informe seu nome de exibição.'
      : displayName.length < DISPLAY_NAME_MIN_LENGTH || displayName.length > DISPLAY_NAME_MAX_LENGTH
        ? `Use de ${DISPLAY_NAME_MIN_LENGTH} a ${DISPLAY_NAME_MAX_LENGTH} caracteres.`
        : undefined,
    username: validateUsername(values.username),
    email: validateEmail(values.email),
  })
}

export function validatePasswordChange(values: ChangePasswordRequest): FieldErrors<ChangePasswordRequest> {
  return withoutEmptyEntries({
    currentPassword: values.currentPassword ? undefined : 'Informe sua senha atual.',
    newPassword:
      validateNewPassword(values.newPassword) ??
      (values.currentPassword && values.newPassword === values.currentPassword
        ? 'A nova senha deve ser diferente da atual.'
        : undefined),
  })
}

export function validatePasswordChangeForm(values: ChangePasswordFormValues): FieldErrors<ChangePasswordFormValues> {
  return withoutEmptyEntries({
    ...validatePasswordChange(values),
    newPasswordConfirmation: !values.newPasswordConfirmation
      ? 'Confirme a nova senha.'
      : values.newPasswordConfirmation === values.newPassword
        ? undefined
        : 'As senhas não conferem.',
  })
}

// Client-side check of the chosen file; the API also checks the decoded content.
export function validateAvatarFile(file: Pick<File, 'type' | 'size'>) {
  if (!AVATAR_MIME_TYPES.some((type) => type === file.type)) return 'Use uma imagem PNG, JPEG ou WebP.'
  if (file.size === 0) return 'O arquivo está vazio.'
  if (file.size > AVATAR_MAX_BYTES) return `A imagem deve ter no máximo ${AVATAR_MAX_BYTES / 1024} KB.`
  return undefined
}

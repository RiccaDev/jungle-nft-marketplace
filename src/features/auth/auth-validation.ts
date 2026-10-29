import type { LoginRequest, RegisterRequest } from './auth.contracts'

// Shared by the forms and the MSW handlers, so client and API reject the same input.
export type FieldErrors<Values> = Partial<Record<keyof Values, string>>

export type RegisterFormValues = RegisterRequest & {
  passwordConfirmation: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9_.]{3,20}$/i
export const PASSWORD_MIN_LENGTH = 8

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function validateEmail(email: string) {
  if (!email.trim()) return 'Informe seu e-mail.'
  if (!EMAIL_PATTERN.test(email.trim())) return 'Informe um e-mail válido.'
  return undefined
}

function validateNewPassword(password: string) {
  if (!password) return 'Informe uma senha.'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
  }
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    return 'A senha deve combinar letras e números.'
  }
  return undefined
}

function withoutEmptyEntries<Values>(errors: FieldErrors<Values>): FieldErrors<Values> {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => message !== undefined),
  ) as FieldErrors<Values>
}

export function hasFieldErrors<Values>(errors: FieldErrors<Values>) {
  return Object.keys(errors).length > 0
}

export function validateLogin(values: LoginRequest): FieldErrors<LoginRequest> {
  return withoutEmptyEntries({
    email: validateEmail(values.email),
    password: values.password ? undefined : 'Informe sua senha.',
  })
}

export function validateRegistration(values: RegisterRequest): FieldErrors<RegisterRequest> {
  const username = values.username.trim()
  return withoutEmptyEntries({
    username: !username
      ? 'Informe um nome de usuário.'
      : USERNAME_PATTERN.test(username)
        ? undefined
        : 'Use de 3 a 20 letras, números, ponto ou sublinhado.',
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
  })
}

export function validateRegistrationForm(values: RegisterFormValues): FieldErrors<RegisterFormValues> {
  return withoutEmptyEntries({
    ...validateRegistration(values),
    passwordConfirmation: !values.passwordConfirmation
      ? 'Confirme sua senha.'
      : values.passwordConfirmation === values.password
        ? undefined
        : 'As senhas não conferem.',
  })
}

import { validateEmail, withoutEmptyEntries, type FieldErrors } from '@/features/auth/auth-validation'
import type { BuyerDetails } from '@/features/orders/order.contracts'

const FULL_NAME_MAX_LENGTH = 80

// Shared by the checkout form and the MSW order handler, so both reject the same input.
export function validateBuyerDetails(values: BuyerDetails): FieldErrors<BuyerDetails> {
  const fullName = values.fullName.trim()
  return withoutEmptyEntries({
    fullName: !fullName
      ? 'Informe seu nome completo.'
      : fullName.split(/\s+/).length < 2
        ? 'Informe nome e sobrenome.'
        : fullName.length > FULL_NAME_MAX_LENGTH
          ? `Use no máximo ${FULL_NAME_MAX_LENGTH} caracteres.`
          : undefined,
    email: validateEmail(values.email),
  })
}

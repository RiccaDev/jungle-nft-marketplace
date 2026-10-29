import type { FormEvent } from 'react'
import type { FieldErrors } from '@/features/auth/auth-validation'
import type { BuyerDetails } from '@/features/orders/order.contracts'
import { CheckoutTextField } from './checkout-text-field'

type BuyerDetailsFormProps = {
  formId: string
  values: BuyerDetails
  fieldErrors: FieldErrors<BuyerDetails>
  onFieldChange: (field: keyof BuyerDetails, value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  registerInput: (field: keyof BuyerDetails) => (input: HTMLInputElement | null) => void
}

// Submitted by the summary's "Revisar pedido" button (form attribute), so it works in both layouts.
export function BuyerDetailsForm({
  formId,
  values,
  fieldErrors,
  onFieldChange,
  onSubmit,
  registerInput,
}: BuyerDetailsFormProps) {
  return (
    <section aria-labelledby="buyer-details-title" className="flex flex-col gap-5">
      <h2 id="buyer-details-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
        1. Dados do colecionador
      </h2>
      <form id={formId} onSubmit={onSubmit} noValidate className="grid gap-4 md:grid-cols-2">
        <CheckoutTextField
          id="buyer-full-name"
          label="Nome completo"
          type="text"
          value={values.fullName}
          onChange={(value) => onFieldChange('fullName', value)}
          autoComplete="name"
          error={fieldErrors.fullName}
          inputRef={registerInput('fullName')}
        />
        <CheckoutTextField
          id="buyer-email"
          label="E-mail para o recibo"
          type="email"
          value={values.email}
          onChange={(value) => onFieldChange('email', value)}
          autoComplete="email"
          error={fieldErrors.email}
          inputRef={registerInput('email')}
        />
      </form>
    </section>
  )
}

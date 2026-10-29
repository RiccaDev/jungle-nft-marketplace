import { useId, useRef, useState, type FormEvent } from 'react'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { hasFieldErrors, type FieldErrors } from '@/features/auth/auth-validation'
import { readApiError } from '@/lib/http/api-error'
import {
  PAYMENT_NETWORK_IDS,
  PAYMENT_NETWORK_LABELS,
  type PaymentNetworkId,
  type WalletFormValues,
  type WalletRole,
} from '../wallet.contracts'
import { validateWallet } from '../wallet-validation'

type WalletFormProps = {
  title: string
  initialValues: WalletFormValues
  // Only when registering a wallet next to an existing one; the first wallet is always primary.
  roleChoice: WalletRole | null
  isSubmitting: boolean
  onSubmit: (values: WalletFormValues, role: WalletRole) => Promise<unknown>
  onCancel: () => void
}

const FIELD_ORDER: (keyof WalletFormValues)[] = ['label', 'address', 'networks']

export function WalletForm({ title, initialValues, roleChoice, isSubmitting, onSubmit, onCancel }: WalletFormProps) {
  const formId = useId()
  const [values, setValues] = useState(initialValues)
  const [role, setRole] = useState<WalletRole>(roleChoice ?? 'primary')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<WalletFormValues>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const fieldRefs = useRef<Partial<Record<keyof WalletFormValues, HTMLElement | null>>>({})
  const networksErrorId = `${formId}-networks-error`

  function focusFirstInvalid(errors: FieldErrors<WalletFormValues>) {
    const field = FIELD_ORDER.find((candidate) => errors[candidate])
    if (field) fieldRefs.current[field]?.focus()
  }

  function update(nextValues: WalletFormValues) {
    setValues(nextValues)
    if (hasSubmitted) setFieldErrors(validateWallet(nextValues))
  }

  function toggleNetwork(network: PaymentNetworkId, checked: boolean) {
    const networks = checked
      ? PAYMENT_NETWORK_IDS.filter((candidate) => candidate === network || values.networks.includes(candidate))
      : values.networks.filter((candidate) => candidate !== network)
    update({ ...values, networks })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)
    setFormError(null)
    const errors = validateWallet(values)
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) {
      focusFirstInvalid(errors)
      return
    }
    try {
      await onSubmit(values, role)
    } catch (error) {
      const apiError = readApiError(error)
      if (apiError?.fieldErrors) {
        const serverErrors = apiError.fieldErrors as FieldErrors<WalletFormValues>
        setFieldErrors(serverErrors)
        focusFirstInvalid(serverErrors)
        return
      }
      setFormError(apiError?.message ?? 'Não foi possível salvar a carteira. Tente novamente.')
    }
  }

  return (
    <form
      aria-label={title}
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-primary/60 bg-surface-card p-5"
    >
      <p className="text-[15px] font-bold text-text-accent">{title}</p>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          id={`${formId}-label`}
          label="Nome da carteira"
          type="text"
          value={values.label}
          onChange={(label) => update({ ...values, label })}
          autoComplete="off"
          error={fieldErrors.label}
          inputRef={(input) => {
            fieldRefs.current.label = input
          }}
        />
        <TextField
          id={`${formId}-address`}
          label="Endereço (0x…)"
          type="text"
          value={values.address}
          onChange={(address) => update({ ...values, address })}
          autoComplete="off"
          error={fieldErrors.address}
          inputRef={(input) => {
            fieldRefs.current.address = input
          }}
        />
      </div>

      <fieldset aria-describedby={fieldErrors.networks ? networksErrorId : undefined} className="flex flex-col gap-2">
        <legend className="mb-2 text-[15px] leading-4 font-bold">Redes compatíveis</legend>
        <div className="flex flex-wrap gap-5">
          {PAYMENT_NETWORK_IDS.map((network, index) => (
            <label key={network} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={values.networks.includes(network)}
                onChange={(event) => toggleNetwork(network, event.target.checked)}
                aria-invalid={fieldErrors.networks ? true : undefined}
                ref={
                  index === 0
                    ? (input) => {
                        fieldRefs.current.networks = input
                      }
                    : undefined
                }
                className="size-4 accent-primary"
              />
              {PAYMENT_NETWORK_LABELS[network]}
            </label>
          ))}
        </div>
        {fieldErrors.networks && (
          <p id={networksErrorId} className="text-[13px] leading-4 text-text-coral">
            {fieldErrors.networks}
          </p>
        )}
      </fieldset>

      {roleChoice && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[15px] leading-4 font-bold">Função</legend>
          <div className="flex flex-wrap gap-5">
            {(['primary', 'secondary'] as const).map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`${formId}-role`}
                  checked={role === option}
                  onChange={() => setRole(option)}
                  className="size-4 accent-primary"
                />
                {option === 'primary' ? 'Principal (a atual passa a ser secundária)' : 'Secundária'}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <p role="alert" className="text-sm text-text-coral empty:hidden">
        {formError}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting} className="font-bold text-ink">
          {isSubmitting ? 'Salvando…' : 'Salvar carteira'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}

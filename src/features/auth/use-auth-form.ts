import { useRef, useState, type FormEvent } from 'react'
import { readApiError } from '@/lib/http/api-error'
import { hasFieldErrors, type FieldErrors } from './auth-validation'

const GENERIC_SUBMIT_ERROR = 'Não foi possível concluir. Verifique sua conexão e tente novamente.'

type UseAuthFormOptions<Values extends Record<string, string>> = {
  initialValues: Values
  validate: (values: Values) => FieldErrors<Values>
  onSubmit: (values: Values) => Promise<unknown>
}

export function useAuthForm<Values extends Record<string, string>>({
  initialValues,
  validate,
  onSubmit,
}: UseAuthFormOptions<Values>) {
  const [values, setValues] = useState(initialValues)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<Values>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const inputs = useRef<Partial<Record<keyof Values, HTMLInputElement | null>>>({})

  function focusFirstInvalidField(errors: FieldErrors<Values>) {
    const firstInvalidField = (Object.keys(values) as (keyof Values)[]).find((field) => errors[field])
    if (firstInvalidField) inputs.current[firstInvalidField]?.focus()
  }

  function setFieldValue(field: keyof Values, value: string) {
    const nextValues = { ...values, [field]: value }
    setValues(nextValues)
    // Errors only follow typing after a first submit attempt, to avoid scolding early.
    if (hasSubmitted) setFieldErrors(validate(nextValues))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setHasSubmitted(true)
    setFormError(null)

    const errors = validate(values)
    setFieldErrors(errors)
    if (hasFieldErrors(errors)) {
      focusFirstInvalidField(errors)
      return
    }

    try {
      await onSubmit(values)
    } catch (error) {
      const apiError = readApiError(error)
      if (apiError?.fieldErrors) {
        const serverErrors = apiError.fieldErrors as FieldErrors<Values>
        setFieldErrors(serverErrors)
        focusFirstInvalidField(serverErrors)
        return
      }
      setFormError(apiError?.message ?? GENERIC_SUBMIT_ERROR)
    }
  }

  return {
    values,
    fieldErrors,
    formError,
    setFieldValue,
    handleSubmit,
    registerInput: (field: keyof Values) => (input: HTMLInputElement | null) => {
      inputs.current[field] = input
    },
  }
}

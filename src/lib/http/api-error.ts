import { isAxiosError } from 'axios'

export type ApiErrorBody = {
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string>
  }
}

export function hasHttpStatus(error: unknown, status: number) {
  return isAxiosError(error) && error.response?.status === status
}

export function readApiError(error: unknown): ApiErrorBody['error'] | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) return undefined
  return error.response?.data?.error
}

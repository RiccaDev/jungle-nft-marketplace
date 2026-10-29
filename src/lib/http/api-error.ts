import { isAxiosError } from 'axios'

export type ApiErrorBody = {
  error: {
    code: string
    message: string
  }
}

export function hasHttpStatus(error: unknown, status: number) {
  return isAxiosError(error) && error.response?.status === status
}

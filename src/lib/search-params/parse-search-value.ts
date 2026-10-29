import { isEthAmount } from '@/lib/eth/eth-amount'

function isAllowedValue<Value extends string>(
  value: string,
  allowedValues: readonly Value[],
): value is Value {
  return (allowedValues as readonly string[]).includes(value)
}

export function parseTrimmedString(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const trimmed = String(value).trim()
  return trimmed === '' ? undefined : trimmed
}

export function parseEnumValue<Value extends string>(value: unknown, allowedValues: readonly Value[]) {
  const text = parseTrimmedString(value)
  return text !== undefined && isAllowedValue(text, allowedValues) ? text : undefined
}

export function parseEnumList<Value extends string>(value: unknown, allowedValues: readonly Value[]) {
  const rawItems = Array.isArray(value) ? value : String(value ?? '').split(',')
  const items = rawItems
    .map((item) => parseEnumValue(item, allowedValues))
    .filter((item): item is Value => item !== undefined)
  const uniqueItems = [...new Set(items)]
  return uniqueItems.length > 0 ? uniqueItems : undefined
}

export function parsePositiveInteger(value: unknown) {
  const number = Number(parseTrimmedString(value))
  return Number.isInteger(number) && number > 0 ? number : undefined
}

export function parseEthAmount(value: unknown) {
  const text = parseTrimmedString(value)
  return text !== undefined && isEthAmount(text) ? text : undefined
}

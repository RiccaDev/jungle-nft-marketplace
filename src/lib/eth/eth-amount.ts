const ETH_DECIMALS = 18
const WEI_PER_ETH = 10n ** BigInt(ETH_DECIMALS)
const ETH_AMOUNT_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthAmount(value: string) {
  return ETH_AMOUNT_PATTERN.test(value)
}

export function ethToWei(value: string): bigint {
  if (!isEthAmount(value)) throw new Error(`Invalid ETH amount: "${value}"`)

  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * WEI_PER_ETH + BigInt(fraction.padEnd(ETH_DECIMALS, '0'))
}

export function compareEth(left: string, right: string) {
  const difference = ethToWei(left) - ethToWei(right)
  if (difference === 0n) return 0
  return difference > 0n ? 1 : -1
}

export function formatEth(value: string) {
  return `${value} ETH`
}

const WEI_PER_HUNDREDTH = WEI_PER_ETH / 100n

// Integer hundredths of ETH, used by range inputs that cannot hold decimal strings safely.
export function ethToHundredths(value: string) {
  return Number(ethToWei(value) / WEI_PER_HUNDREDTH)
}

export function hundredthsToEth(hundredths: number) {
  const whole = Math.floor(hundredths / 100)
  const fraction = String(hundredths % 100).padStart(2, '0')
  return `${whole}.${fraction}`
}

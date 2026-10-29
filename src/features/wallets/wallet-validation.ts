import { withoutEmptyEntries, type FieldErrors } from '@/features/auth/auth-validation'
import { PAYMENT_NETWORK_IDS, type WalletFormValues } from './wallet.contracts'

// Both payment networks are EVM chains: 0x followed by 40 hexadecimal characters.
const EVM_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/
const LABEL_MIN_LENGTH = 2
const LABEL_MAX_LENGTH = 30

export function normalizeWalletAddress(address: string) {
  return address.trim().toLowerCase()
}

// Shared by the wallet forms and the MSW handlers, so client and API reject the same input.
export function validateWallet(values: WalletFormValues): FieldErrors<WalletFormValues> {
  const label = values.label.trim()
  const address = values.address.trim()
  const hasUnknownNetwork = values.networks.some((network) => !PAYMENT_NETWORK_IDS.includes(network))
  return withoutEmptyEntries({
    label: !label
      ? 'Dê um nome à carteira.'
      : label.length < LABEL_MIN_LENGTH || label.length > LABEL_MAX_LENGTH
        ? `Use de ${LABEL_MIN_LENGTH} a ${LABEL_MAX_LENGTH} caracteres.`
        : undefined,
    address: !address
      ? 'Informe o endereço da carteira.'
      : EVM_ADDRESS_PATTERN.test(address)
        ? undefined
        : 'Use um endereço 0x com 40 caracteres hexadecimais.',
    networks:
      values.networks.length === 0
        ? 'Selecione ao menos uma rede.'
        : hasUnknownNetwork
          ? 'Rede não suportada.'
          : undefined,
  })
}

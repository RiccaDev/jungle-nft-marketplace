import type { NftNetworkId } from '@/features/nfts/nft.contracts'

export type MockCoupon = {
  code: string
  description: string
  discount: { kind: 'percent'; percent: number } | { kind: 'fixed'; amountEth: string }
  expiresAt: string | null
}

export const MOCK_COUPONS: MockCoupon[] = [
  {
    code: 'KURIO10',
    description: '10% de desconto do lançamento',
    discount: { kind: 'percent', percent: 10 },
    expiresAt: null,
  },
  {
    code: 'GENESIS',
    description: '0.10 ETH de desconto gênesis',
    discount: { kind: 'fixed', amountEth: '0.10' },
    expiresAt: null,
  },
  {
    code: 'VERAO2025',
    description: '15% de desconto de verão',
    discount: { kind: 'percent', percent: 15 },
    expiresAt: '2025-03-31T23:59:59.000Z',
  },
]

// Estimated gas per network present in the order (one settlement per network).
export const NETWORK_FEES_ETH: Record<NftNetworkId, string> = {
  ethereum: '0.012',
  polygon: '0.004',
  solana: '0.004',
}

export const QUOTE_TTL_MS = 2 * 60 * 1000

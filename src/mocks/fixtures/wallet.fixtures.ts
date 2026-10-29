import type { Wallet } from '@/features/wallets/wallet.contracts'

// Registered wallets of the fixture users (wallet registration and editing are a later step).
export const FIXTURE_WALLETS: Record<string, Wallet[]> = {
  'user-ana': [
    {
      id: 'wallet-ana-primary',
      label: 'Carteira principal',
      role: 'primary',
      address: '0x9f3A6b1C2d4E5f60718293A4b5C6d7E8f901c41E',
      networks: ['ethereum', 'polygon'],
    },
    {
      id: 'wallet-ana-secondary',
      label: 'Carteira de coleção',
      role: 'secondary',
      address: '0x2B7c90dE41a3F5b6C7d8E9f0A1b2C3d4E5f6a7B8',
      networks: ['polygon'],
    },
  ],
  'user-bruno': [
    {
      id: 'wallet-bruno-primary',
      label: 'Carteira principal',
      role: 'primary',
      address: '0x51dE0a9B8c7D6e5F4a3B2c1D0e9F8a7B6c5D4e3F',
      networks: ['ethereum', 'polygon'],
    },
  ],
}

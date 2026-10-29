import type { DemoNft } from '@/features/realtime-demo/demo-nft.api'

const INITIAL_DEMO_NFT: DemoNft = {
  id: 'demo-nft-1',
  name: 'NFT de demonstração #1',
  priceEth: '0.75',
  availableQuantity: 10,
  version: 1,
}

// Deterministic sequence applied in order (and cycled) on each simulated server change.
const SCRIPTED_MARKET_CHANGES: ReadonlyArray<Pick<DemoNft, 'priceEth' | 'availableQuantity'>> = [
  { priceEth: '0.82', availableQuantity: 9 },
  { priceEth: '0.91', availableQuantity: 7 },
  { priceEth: '0.68', availableQuantity: 0 },
]

let demoNft: DemoNft = { ...INITIAL_DEMO_NFT }
let appliedChangeCount = 0

export function getDemoNft(): DemoNft {
  return { ...demoNft }
}

export function applyNextMarketChange(): DemoNft {
  const nextChange = SCRIPTED_MARKET_CHANGES[appliedChangeCount % SCRIPTED_MARKET_CHANGES.length]
  if (!nextChange) throw new Error('No scripted market changes configured')

  appliedChangeCount += 1
  demoNft = { ...demoNft, ...nextChange, version: demoNft.version + 1 }
  return getDemoNft()
}

import type { NftEdition, NftEditionTier } from './nft.contracts'

// Larger limited editions are offered first; the unique 1/1 is only a fallback.
const DEFAULT_EDITION_PRIORITY: NftEditionTier[] = ['one-of-fifty', 'one-of-ten', 'open', 'one-of-one']

export function findEdition(editions: readonly NftEdition[], tier: NftEditionTier | undefined) {
  return editions.find((edition) => edition.tier === tier)
}

export function pickDefaultEditionTier(editions: readonly NftEdition[]) {
  const prioritizedEditions = DEFAULT_EDITION_PRIORITY.map((tier) => findEdition(editions, tier)).filter(
    (edition): edition is NftEdition => edition !== undefined,
  )
  return (prioritizedEditions.find((edition) => edition.availableQuantity > 0) ?? prioritizedEditions[0])
    ?.tier
}

export function maxSelectableQuantity(edition: NftEdition | undefined) {
  if (!edition) return 0
  return Math.max(0, Math.min(edition.availableQuantity, edition.maxPerOrder))
}

export function totalAvailableQuantity(editions: readonly NftEdition[]) {
  return editions.reduce((total, edition) => total + edition.availableQuantity, 0)
}

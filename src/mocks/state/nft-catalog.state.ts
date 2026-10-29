import { ethToHundredths, hundredthsToEth } from '@/lib/eth/eth-amount'
import { pickDefaultEditionTier, totalAvailableQuantity } from '@/features/nfts/nft-edition-selection'
import {
  createNftCatalogFixtures,
  FEATURED_NFT_ID,
  type NftCatalogRecord,
} from '../fixtures/nft-catalog.fixtures'

type ScriptedMarketChange = {
  priceDeltaHundredths: number
  soldQuantity: number | 'all'
}

// Applied in order (and cycled) per NFT, so each simulated server change is reproducible.
const SCRIPTED_MARKET_CHANGES: ScriptedMarketChange[] = [
  { priceDeltaHundredths: 7, soldQuantity: 1 },
  { priceDeltaHundredths: 9, soldQuantity: 2 },
  { priceDeltaHundredths: -23, soldQuantity: 'all' },
]
const MIN_PRICE_HUNDREDTHS = 1

const nftCatalog: NftCatalogRecord[] = createNftCatalogFixtures()
const appliedChangeCountByNftId = new Map<string, number>()

export function listNftCatalogRecords(): readonly NftCatalogRecord[] {
  return nftCatalog
}

export function findNftRecord(nftId: string) {
  return nftCatalog.find((record) => record.id === nftId)
}

export function findFeaturedNftRecord() {
  return findNftRecord(FEATURED_NFT_ID)
}

function sellEditions(record: NftCatalogRecord, soldQuantity: ScriptedMarketChange['soldQuantity']) {
  if (soldQuantity === 'all') {
    return record.editions.map((edition) => ({ ...edition, availableQuantity: 0 }))
  }
  const soldTier = pickDefaultEditionTier(record.editions)
  return record.editions.map((edition) =>
    edition.tier === soldTier
      ? { ...edition, availableQuantity: Math.max(0, edition.availableQuantity - soldQuantity) }
      : edition,
  )
}

export function applyNextMarketChange(nftId: string) {
  const recordIndex = nftCatalog.findIndex((record) => record.id === nftId)
  const record = nftCatalog[recordIndex]
  if (!record) return undefined

  const appliedChangeCount = appliedChangeCountByNftId.get(nftId) ?? 0
  const change = SCRIPTED_MARKET_CHANGES[appliedChangeCount % SCRIPTED_MARKET_CHANGES.length]
  if (!change) return undefined

  const priceHundredths = Math.max(
    MIN_PRICE_HUNDREDTHS,
    ethToHundredths(record.priceEth) + change.priceDeltaHundredths,
  )
  const editions = sellEditions(record, change.soldQuantity)
  const updatedRecord: NftCatalogRecord = {
    ...record,
    priceEth: hundredthsToEth(priceHundredths),
    editions,
    availableQuantity: totalAvailableQuantity(editions),
    version: record.version + 1,
  }

  nftCatalog[recordIndex] = updatedRecord
  appliedChangeCountByNftId.set(nftId, appliedChangeCount + 1)
  return updatedRecord
}

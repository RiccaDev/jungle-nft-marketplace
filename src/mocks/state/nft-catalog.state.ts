import { ethToHundredths, hundredthsToEth } from '@/lib/eth/eth-amount'
import type { NftEditionTier } from '@/features/nfts/nft.contracts'
import { pickDefaultEditionTier, totalAvailableQuantity } from '@/features/nfts/nft-edition-selection'
import {
  createNftCatalogFixtures,
  FEATURED_NFT_ID,
  type NftCatalogRecord,
} from '../fixtures/nft-catalog.fixtures'
import { loadMockState, saveMockState } from './mock-storage'

type ScriptedMarketChange = {
  priceDeltaHundredths: number
  soldQuantity: number | 'all'
}

// Only the mutable part of a record is persisted; the rest always comes from the fixtures.
type PersistedRecordChange = Pick<NftCatalogRecord, 'priceEth' | 'editions' | 'availableQuantity' | 'version'>

type PersistedCatalogState = {
  changedRecords: Record<string, PersistedRecordChange>
  appliedChangeCounts: Record<string, number>
}

// Applied in order (and cycled) per NFT, so each simulated server change is reproducible.
const SCRIPTED_MARKET_CHANGES: ScriptedMarketChange[] = [
  { priceDeltaHundredths: 7, soldQuantity: 1 },
  { priceDeltaHundredths: 9, soldQuantity: 2 },
  { priceDeltaHundredths: -23, soldQuantity: 'all' },
]
const MIN_PRICE_HUNDREDTHS = 1

// Persisted (like carts and orders) so stock reserved by an order stays consistent after a refresh.
const STORAGE_NAME = 'catalog:v1'
const persisted = loadMockState<PersistedCatalogState>(STORAGE_NAME, () => ({
  changedRecords: {},
  appliedChangeCounts: {},
}))

const nftCatalog: NftCatalogRecord[] = createNftCatalogFixtures().map((record) => ({
  ...record,
  ...persisted.changedRecords[record.id],
}))

export function listNftCatalogRecords(): readonly NftCatalogRecord[] {
  return nftCatalog
}

export function findNftRecord(nftId: string) {
  return nftCatalog.find((record) => record.id === nftId)
}

export function findFeaturedNftRecord() {
  return findNftRecord(FEATURED_NFT_ID)
}

// Every change bumps the version, the same one carried by REST responses and nft.updated.
function replaceRecord(record: NftCatalogRecord, changes: Pick<NftCatalogRecord, 'priceEth' | 'editions'>) {
  const updatedRecord: NftCatalogRecord = {
    ...record,
    ...changes,
    availableQuantity: totalAvailableQuantity(changes.editions),
    version: record.version + 1,
  }
  const recordIndex = nftCatalog.findIndex((candidate) => candidate.id === record.id)
  nftCatalog[recordIndex] = updatedRecord

  const { priceEth, editions, availableQuantity, version } = updatedRecord
  persisted.changedRecords[record.id] = { priceEth, editions, availableQuantity, version }
  saveMockState(STORAGE_NAME, persisted)
  return updatedRecord
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
  const record = findNftRecord(nftId)
  if (!record) return undefined

  const appliedChangeCount = persisted.appliedChangeCounts[nftId] ?? 0
  const change = SCRIPTED_MARKET_CHANGES[appliedChangeCount % SCRIPTED_MARKET_CHANGES.length]
  if (!change) return undefined

  const priceHundredths = Math.max(
    MIN_PRICE_HUNDREDTHS,
    ethToHundredths(record.priceEth) + change.priceDeltaHundredths,
  )
  persisted.appliedChangeCounts[nftId] = appliedChangeCount + 1
  return replaceRecord(record, {
    priceEth: hundredthsToEth(priceHundredths),
    editions: sellEditions(record, change.soldQuantity),
  })
}

// Negative deltas reserve stock for an order; positive deltas release it after a rejection.
export function adjustEditionStock(nftId: string, editionTier: NftEditionTier, delta: number) {
  const record = findNftRecord(nftId)
  if (!record) return undefined

  const editions = record.editions.map((edition) =>
    edition.tier === editionTier
      ? { ...edition, availableQuantity: Math.max(0, edition.availableQuantity + delta) }
      : edition,
  )
  return replaceRecord(record, { priceEth: record.priceEth, editions })
}

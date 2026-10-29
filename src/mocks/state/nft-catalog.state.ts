import {
  createNftCatalogFixtures,
  FEATURED_NFT_ID,
  type NftCatalogRecord,
} from '../fixtures/nft-catalog.fixtures'

const nftCatalog: NftCatalogRecord[] = createNftCatalogFixtures()

export function listNftCatalogRecords(): readonly NftCatalogRecord[] {
  return nftCatalog
}

export function findFeaturedNftRecord() {
  return nftCatalog.find((record) => record.id === FEATURED_NFT_ID)
}

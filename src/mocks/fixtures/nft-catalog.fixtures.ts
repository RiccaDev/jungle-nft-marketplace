import { hundredthsToEth } from '@/lib/eth/eth-amount'
import {
  NFT_COLLECTION_IDS,
  NFT_NETWORK_IDS,
  type NftCollectionId,
  type NftImage,
  type NftNetworkId,
  type NftSummary,
} from '@/features/nfts/nft.contracts'

export type NftCatalogRecord = NftSummary & {
  salesLast7Days: number
}

// Fixed "now" for the catalog, so segments such as new releases are deterministic.
export const CATALOG_REFERENCE_DATE = new Date('2026-10-01T12:00:00.000Z')
export const FEATURED_NFT_ID = 'sage-nomad-009'

const HOUR_MS = 60 * 60 * 1000

const ARTWORKS = {
  sunglassesVarsity: {
    slug: 'ape-sunglasses-varsity',
    alt: 'Macaco ilustrado com óculos redondos e jaqueta universitária verde',
  },
  bucketHatHoodie: {
    slug: 'ape-bucket-hat-hoodie',
    alt: 'Gorila ilustrado com chapéu bucket verde e moletom lilás',
  },
  turtleneckBlazer: {
    slug: 'ape-turtleneck-blazer',
    alt: 'Macaco ilustrado com gola alta verde e blazer bege',
  },
  headphonesJacket: {
    slug: 'ape-headphones-jacket',
    alt: 'Orangotango ilustrado com fones de ouvido e jaqueta clara',
  },
} as const

type Artwork = (typeof ARTWORKS)[keyof typeof ARTWORKS]
const ARTWORK_ROTATION: Artwork[] = Object.values(ARTWORKS)

function toNftImage(artwork: Artwork): NftImage {
  const basePath = `${import.meta.env.BASE_URL}images/nfts/${artwork.slug}`
  return {
    src: `${basePath}-480.webp`,
    srcSet: `${basePath}-480.webp 480w, ${basePath}-960.webp 960w`,
    alt: artwork.alt,
  }
}

function toNftId(name: string) {
  return name.toLowerCase().replace('#', '').replace(/\s+/g, '-')
}

function hoursBeforeReference(hours: number) {
  return new Date(CATALOG_REFERENCE_DATE.getTime() - hours * HOUR_MS).toISOString()
}

type NftSeed = {
  name: string
  collectionId: NftCollectionId
  network: NftNetworkId
  priceEth: string
  previousPriceEth?: string
  availableQuantity: number
  rarity?: 'rare'
  artwork: Artwork
  listedHoursAgo: number
  salesLast7Days: number
}

function toRecord(seed: NftSeed): NftCatalogRecord {
  return {
    id: toNftId(seed.name),
    name: seed.name,
    collectionId: seed.collectionId,
    network: seed.network,
    priceEth: seed.priceEth,
    previousPriceEth: seed.previousPriceEth ?? null,
    availableQuantity: seed.availableQuantity,
    rarity: seed.rarity ?? null,
    image: toNftImage(seed.artwork),
    listedAt: hoursBeforeReference(seed.listedHoursAgo),
    version: 1,
    salesLast7Days: seed.salesLast7Days,
  }
}

// Mirrors the first catalog page of the Figma design (names, prices and artwork).
const DESIGN_REFERENCE_SEEDS: NftSeed[] = [
  { name: 'Emerald Ape #042', collectionId: 'digital-art', network: 'ethereum', priceEth: '1.19', availableQuantity: 8, artwork: ARTWORKS.sunglassesVarsity, listedHoursAgo: 2, salesLast7Days: 41 },
  { name: 'Sage Nomad #009', collectionId: 'digital-art', network: 'polygon', priceEth: '1.69', availableQuantity: 5, rarity: 'rare', artwork: ARTWORKS.bucketHatHoodie, listedHoursAgo: 5, salesLast7Days: 33 },
  { name: 'Neon Vessel #552', collectionId: 'generative', network: 'ethereum', priceEth: '1.99', previousPriceEth: '2.29', availableQuantity: 3, artwork: ARTWORKS.turtleneckBlazer, listedHoursAgo: 9, salesLast7Days: 18 },
  { name: 'Cosmic Bloom #118', collectionId: '3d-art', network: 'solana', priceEth: '1.29', availableQuantity: 12, artwork: ARTWORKS.bucketHatHoodie, listedHoursAgo: 14, salesLast7Days: 27 },
  { name: 'Violet Nomad #314', collectionId: 'collectibles', network: 'polygon', priceEth: '1.39', availableQuantity: 6, artwork: ARTWORKS.bucketHatHoodie, listedHoursAgo: 20, salesLast7Days: 9 },
  { name: 'Ivory Baron #088', collectionId: 'photography', network: 'ethereum', priceEth: '1.79', availableQuantity: 0, rarity: 'rare', artwork: ARTWORKS.turtleneckBlazer, listedHoursAgo: 27, salesLast7Days: 30 },
  { name: 'Golden Beat #207', collectionId: 'music', network: 'solana', priceEth: '0.99', availableQuantity: 10, artwork: ARTWORKS.headphonesJacket, listedHoursAgo: 35, salesLast7Days: 22 },
  { name: 'Golden Echo #131', collectionId: 'music', network: 'ethereum', priceEth: '0.89', availableQuantity: 4, artwork: ARTWORKS.headphonesJacket, listedHoursAgo: 44, salesLast7Days: 14 },
  { name: 'Golden Signal #160', collectionId: 'gaming', network: 'polygon', priceEth: '0.39', availableQuantity: 15, artwork: ARTWORKS.headphonesJacket, listedHoursAgo: 54, salesLast7Days: 26 },
]

const GENERATED_NAME_STEMS = [
  'Amber Drifter',
  'Copper Monk',
  'Jade Pilot',
  'Onyx Rider',
  'Rust Prophet',
  'Saffron Echo',
  'Cedar Sage',
  'Velvet Rogue',
  'Mocha Ranger',
  'Crimson Oracle',
  'Obsidian Muse',
  'Bronze Scout',
  'Lunar Wanderer',
  'Sepia Dreamer',
  'Tawny Herald',
  'Cobalt Hermit',
  'Olive Bard',
  'Ember Sentinel',
]
const GENERATED_EDITIONS_PER_STEM = 3
const LOWEST_PRICE_HUNDREDTHS = 2
const HIGHEST_PRICE_HUNDREDTHS = 1230

function pickCyclic<Item>(items: readonly Item[], index: number): Item {
  const item = items[index % items.length]
  if (item === undefined) throw new Error('Cannot pick from an empty list')
  return item
}

function generatedPriceHundredths(index: number, total: number) {
  if (index === total - 1) return HIGHEST_PRICE_HUNDREDTHS
  return ((index * 7919) % (HIGHEST_PRICE_HUNDREDTHS - LOWEST_PRICE_HUNDREDTHS)) + LOWEST_PRICE_HUNDREDTHS
}

function buildGeneratedSeeds(): NftSeed[] {
  const total = GENERATED_NAME_STEMS.length * GENERATED_EDITIONS_PER_STEM

  return Array.from({ length: total }, (_, index) => {
    const priceHundredths = generatedPriceHundredths(index, total)
    const editionNumber = String((index * 37 + 101) % 1000).padStart(3, '0')

    return {
      name: `${pickCyclic(GENERATED_NAME_STEMS, index)} #${editionNumber}`,
      collectionId: pickCyclic(NFT_COLLECTION_IDS, index),
      network: pickCyclic(NFT_NETWORK_IDS, index * 2 + Math.floor(index / 9)),
      priceEth: hundredthsToEth(priceHundredths),
      previousPriceEth: index % 7 === 3 ? hundredthsToEth(priceHundredths + 30) : undefined,
      availableQuantity: index % 11 === 5 ? 0 : 1 + ((index * 3) % 12),
      rarity: index % 6 === 2 ? 'rare' : undefined,
      artwork: pickCyclic(ARTWORK_ROTATION, index),
      listedHoursAgo: 60 + index * 19,
      salesLast7Days: (index * 13) % 40,
    }
  })
}

export function createNftCatalogFixtures(): NftCatalogRecord[] {
  return [...DESIGN_REFERENCE_SEEDS, ...buildGeneratedSeeds()].map(toRecord)
}

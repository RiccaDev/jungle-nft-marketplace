import { hundredthsToEth } from '@/lib/eth/eth-amount'
import {
  NFT_COLLECTION_IDS,
  NFT_NETWORK_IDS,
  type NftCollectionId,
  type NftDetail,
  type NftEdition,
  type NftGalleryView,
  type NftImage,
  type NftNetworkId,
} from '@/features/nfts/nft.contracts'
import { totalAvailableQuantity } from '@/features/nfts/nft-edition-selection'
import { NFT_NETWORK_LABELS } from '@/features/nfts/nft-labels'

export type NftCatalogRecord = NftDetail & {
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
    seriesName: 'Kurio Apes',
    attributes: ['Óculos', 'Esmeralda'],
  },
  bucketHatHoodie: {
    slug: 'ape-bucket-hat-hoodie',
    alt: 'Gorila ilustrado com chapéu bucket verde e moletom lilás',
    seriesName: 'Nomad Club',
    attributes: ['Chapéu bucket', 'Moletom'],
  },
  turtleneckBlazer: {
    slug: 'ape-turtleneck-blazer',
    alt: 'Macaco ilustrado com gola alta verde e blazer bege',
    seriesName: 'Baron Society',
    attributes: ['Gola alta', 'Blazer'],
  },
  headphonesJacket: {
    slug: 'ape-headphones-jacket',
    alt: 'Orangotango ilustrado com fones de ouvido e jaqueta clara',
    seriesName: 'Golden Frequencies',
    attributes: ['Fones de ouvido', 'Jaqueta'],
  },
} as const

type Artwork = (typeof ARTWORKS)[keyof typeof ARTWORKS]
const ARTWORK_ROTATION: Artwork[] = Object.values(ARTWORKS)

const CREATOR_NAMES = ['Nova Sato', 'Iris Kellan', 'Theo Marlow', 'Ayla Corbin', 'Rafa Duarte', 'Mina Okafor']
const ROYALTY_PERCENTAGES = [5, 7, 10]

const GALLERY_VIEWS: NftGalleryView[] = [
  { id: 'full', label: 'Obra completa', zoom: 1, focusX: 50, focusY: 50 },
  { id: 'portrait', label: 'Detalhe do rosto', zoom: 1.8, focusX: 50, focusY: 38 },
  { id: 'outfit', label: 'Detalhe do figurino', zoom: 2, focusX: 50, focusY: 85 },
  { id: 'texture', label: 'Detalhe da textura', zoom: 2.6, focusX: 30, focusY: 55 },
]

const MAX_PER_ORDER_BY_TIER = {
  'one-of-one': 1,
  'one-of-ten': 2,
  'one-of-fifty': 5,
  open: 10,
} as const

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

function toHexWord(value: number) {
  return (value & 0xffff).toString(16).toUpperCase().padStart(4, '0')
}

// Splits the total stock across editions; the 1/50 edition keeps the largest share.
function splitAvailability(totalAvailable: number, index: number): NftEdition[] {
  const oneOfOne = totalAvailable > 0 && index % 2 === 0 ? 1 : 0
  let remaining = totalAvailable - oneOfOne
  const oneOfTen = Math.min(Math.floor(remaining / 4), 10)
  remaining -= oneOfTen
  const oneOfFifty = Math.min(Math.ceil(remaining / 2), 50)
  const open = remaining - oneOfFifty

  return [
    { tier: 'one-of-one', availableQuantity: oneOfOne, maxPerOrder: MAX_PER_ORDER_BY_TIER['one-of-one'] },
    { tier: 'one-of-ten', availableQuantity: oneOfTen, maxPerOrder: MAX_PER_ORDER_BY_TIER['one-of-ten'] },
    { tier: 'one-of-fifty', availableQuantity: oneOfFifty, maxPerOrder: MAX_PER_ORDER_BY_TIER['one-of-fifty'] },
    { tier: 'open', availableQuantity: open, maxPerOrder: MAX_PER_ORDER_BY_TIER.open },
  ]
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

function pickCyclic<Item>(items: readonly Item[], index: number): Item {
  const item = items[index % items.length]
  if (item === undefined) throw new Error('Cannot pick from an empty list')
  return item
}

function toRecord(seed: NftSeed, index: number): NftCatalogRecord {
  const editions = splitAvailability(seed.availableQuantity, index)
  const creatorName = pickCyclic(CREATOR_NAMES, index)
  const royaltyPercent = pickCyclic(ROYALTY_PERCENTAGES, index)
  const networkLabel = NFT_NETWORK_LABELS[seed.network]
  const { seriesName } = seed.artwork

  return {
    id: toNftId(seed.name),
    name: seed.name,
    collectionId: seed.collectionId,
    network: seed.network,
    priceEth: seed.priceEth,
    previousPriceEth: seed.previousPriceEth ?? null,
    availableQuantity: totalAvailableQuantity(editions),
    rarity: seed.rarity ?? null,
    image: toNftImage(seed.artwork),
    listedAt: hoursBeforeReference(seed.listedHoursAgo),
    version: 1,
    tokenId: `#${seed.name.split('#')[1]?.padStart(4, '0') ?? '0000'}`,
    seriesName,
    creatorName,
    royaltyPercent,
    attributes: seed.rarity ? [...seed.artwork.attributes, 'Raro'] : [...seed.artwork.attributes],
    summary: `Um colecionável digital finalizado à mão da coleção ${seriesName}, verificado na ${networkLabel}, com arte desbloqueável e acesso para colecionadores.`,
    description: [
      `${seed.name} é uma obra digital finalizada à mão da coleção ${seriesName}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabel}. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creatorName} recebe ${royaltyPercent}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    networkDescription: `Cunhado na ${networkLabel} com procedência imutável e metadados armazenados no IPFS.`,
    contractAddress: `0x${toHexWord(0x7a42 + index * 0x1f3)}...${toHexWord(0x19e8 + index * 0x2b7)}`,
    contractStandard: 'ERC-721',
    rating: {
      average: (40 + ((index * 7 + 8) % 11)) / 10,
      reviewCount: 19 + ((index * 11) % 60),
    },
    editions,
    gallery: GALLERY_VIEWS,
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

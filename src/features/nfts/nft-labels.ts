import type {
  NftCatalogSegment,
  NftCollectionId,
  NftNetworkId,
  NftSortOption,
} from './nft.contracts'

export const NFT_COLLECTION_LABELS: Record<NftCollectionId, string> = {
  'digital-art': 'Arte digital',
  photography: 'Fotografia',
  music: 'Música',
  '3d-art': 'Arte 3D',
  collectibles: 'Colecionáveis',
  generative: 'Generativa',
  gaming: 'Jogos',
  signatures: 'Assinaturas',
  utility: 'Utilidade',
}

export const NFT_NETWORK_LABELS: Record<NftNetworkId, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

export const NFT_SORT_LABELS: Record<NftSortOption, string> = {
  'recently-listed': 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  'name-asc': 'Nome (A–Z)',
}

export const NFT_SEGMENT_LABELS: Record<NftCatalogSegment, string> = {
  all: 'Todos os NFTs',
  'new-releases': 'Novos lançamentos',
  trending: 'Em alta',
}

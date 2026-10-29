import type { NftDetail } from '@/features/nfts/nft.contracts'
import { NFT_COLLECTION_LABELS } from '@/features/nfts/nft-labels'

export function NftTokenInfo({ nft }: { nft: NftDetail }) {
  const details = [
    { term: 'ID do token', value: nft.tokenId },
    { term: 'Coleção', value: NFT_COLLECTION_LABELS[nft.collectionId] },
    { term: 'Série', value: nft.seriesName },
    { term: 'Criador', value: nft.creatorName },
    { term: 'Atributos', value: nft.attributes.join(', ') },
  ]

  return (
    <dl className="flex flex-col gap-3 text-[15px] text-brand-secondary">
      {details.map((detail) => (
        <div key={detail.term}>
          <dt className="inline">{detail.term}: </dt>
          <dd className="inline">{detail.value}</dd>
        </div>
      ))}
    </dl>
  )
}

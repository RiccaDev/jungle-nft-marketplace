import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NftCard } from '@/features/nfts/components/nft-card'
import { relatedNftsQueryOptions } from '@/features/nfts/nfts.api'

const RELATED_GRID_CLASS = 'grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-x-[26px]'
const RELATED_SKELETON_COUNT = 5

export function RelatedNftsSection({ nftId }: { nftId: string }) {
  const relatedNfts = useQuery(relatedNftsQueryOptions(nftId))
  if (relatedNfts.isSuccess && relatedNfts.data.length === 0) return null

  return (
    <section aria-labelledby="related-nfts-title" aria-busy={relatedNfts.isPending} className="flex flex-col gap-8">
      <h2
        id="related-nfts-title"
        className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent"
      >
        Mais desta coleção
      </h2>

      {relatedNfts.isPending && (
        <ul className={RELATED_GRID_CLASS} aria-hidden="true">
          {Array.from({ length: RELATED_SKELETON_COUNT }, (_, index) => (
            <li key={index} className="flex flex-col gap-3">
              <Skeleton className="aspect-[175/200] rounded-[20px] md:aspect-[219/255] md:rounded-none" />
              <Skeleton className="h-4 w-3/4" />
            </li>
          ))}
        </ul>
      )}

      {relatedNfts.isError && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">Não foi possível carregar NFTs relacionados.</p>
          <Button variant="outline" size="sm" onClick={() => void relatedNfts.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {relatedNfts.isSuccess && (
        <ul className={RELATED_GRID_CLASS} data-testid="related-nfts">
          {relatedNfts.data.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

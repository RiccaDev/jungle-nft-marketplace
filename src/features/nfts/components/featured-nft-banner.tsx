import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { featuredNftQueryOptions } from '../nfts.api'

export function FeaturedNftBanner() {
  const featuredNft = useQuery(featuredNftQueryOptions())

  return (
    <section
      aria-labelledby="featured-nft-title"
      className="relative flex flex-col gap-4 overflow-hidden bg-linear-to-b from-primary/10 to-primary/[0.03] pt-6 pb-1"
    >
      <div className="flex flex-col gap-4">
        <h2 id="featured-nft-title" className="px-5 text-2xl leading-8 font-bold text-text-accent uppercase">
          NFT em destaque
        </h2>
        <p className="px-5 text-center text-[22px] leading-4 font-bold uppercase">Oferta limitada</p>
      </div>

      {featuredNft.isPending && <Skeleton className="h-[368px] rounded-[22px]" />}

      {featuredNft.isError && (
        <p className="flex h-[368px] items-center justify-center px-5 text-center text-sm text-muted-foreground">
          Destaque indisponível no momento.
        </p>
      )}

      {featuredNft.isSuccess && (
        <Link
          to="/nfts/$nftId"
          params={{ nftId: featuredNft.data.id }}
          className="relative block h-[368px] rounded-[22px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <img
            src={featuredNft.data.image.src}
            srcSet={featuredNft.data.image.srcSet}
            sizes="310px"
            alt={featuredNft.data.image.alt}
            width={480}
            height={480}
            loading="lazy"
            decoding="async"
            className="size-full rounded-[22px] object-cover"
          />
          <span className="sr-only">Ver {featuredNft.data.name}</span>
        </Link>
      )}

      <span
        aria-hidden="true"
        className="absolute top-[299px] left-4 size-[22px] rounded-[7px] border-2 border-[#46a358] opacity-20"
      />
      <span
        aria-hidden="true"
        className="absolute top-[343px] left-[248px] size-[45px] rounded-[29px] bg-[linear-gradient(145.46deg,rgba(210,138,76,0.3)_46%,rgba(210,138,76,0)_103%)]"
      />
      <span
        aria-hidden="true"
        className="absolute top-[105px] left-[38px] size-[15px] rounded-[29px] bg-[linear-gradient(145.46deg,rgba(210,138,76,0.3)_46%,rgba(210,138,76,0)_103%)]"
      />
    </section>
  )
}

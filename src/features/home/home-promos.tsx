import { Link } from '@tanstack/react-router'
import promoArrowRightIcon from '@/assets/figma/home/promo-arrow-right.svg'
import promoDecoration from '@/assets/figma/home/promo-decoration.svg'
import type { NftListFilters } from '@/features/nfts/nft.contracts'
import { HOME_ARTWORK } from './home-artwork'

type Promo = {
  titleLines: [string, string]
  description: string
  artwork: (typeof HOME_ARTWORK)[keyof typeof HOME_ARTWORK]
  catalogFilters: NftListFilters
}

const PROMOS: Promo[] = [
  {
    titleLines: ['Lançamentos gênesis', 'de edição limitada'],
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    artwork: HOME_ARTWORK.sunglassesVarsity,
    catalogFilters: { segment: 'new-releases' },
  },
  {
    titleLines: ['Arte digital selecionada', 'e muito mais'],
    description:
      'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    artwork: HOME_ARTWORK.turtleneckBlazer,
    catalogFilters: { collections: ['digital-art'] },
  },
]

function PromoCard({ promo }: { promo: Promo }) {
  return (
    <article className="relative flex min-h-[250px] overflow-hidden rounded-lg bg-surface-card">
      <img
        src={promo.artwork.src}
        srcSet={promo.artwork.srcSet}
        sizes="(min-width: 1024px) 292px, 50vw"
        alt=""
        width={292}
        height={250}
        loading="lazy"
        decoding="async"
        className="absolute inset-y-0 -left-[5px] h-full w-1/2 rounded-[18px] object-cover"
      />
      <img
        src={promoDecoration}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 size-full max-w-none"
      />
      <div className="relative ml-auto flex w-1/2 flex-col items-end gap-2 pt-[37px] pr-[30px] pb-6 text-right">
        <h3 className="text-lg leading-6 font-bold whitespace-nowrap">
          {promo.titleLines[0]}
          <br />
          {promo.titleLines[1]}
        </h3>
        <p className="max-w-[263px] text-sm leading-6 text-text-secondary">{promo.description}</p>
        <Link
          to="/"
          search={promo.catalogFilters}
          hash="catalogo"
          activeOptions={{ exact: true }}
          className="mt-auto flex h-10 w-[140px] shrink-0 items-center justify-center gap-1 rounded-md bg-primary text-sm leading-5 font-medium text-ink hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        >
          Explorar
          <img src={promoArrowRightIcon} alt="" width={11} height={13} className="-rotate-90" />
          <span className="sr-only">: {promo.titleLines.join(' ')}</span>
        </Link>
      </div>
    </article>
  )
}

export function HomePromos() {
  return (
    <section aria-label="Destaques do mercado" className="page-container mt-24 max-md:hidden">
      <div className="grid gap-7 lg:grid-cols-2">
        {PROMOS.map((promo) => (
          <PromoCard key={promo.titleLines[0]} promo={promo} />
        ))}
      </div>
    </section>
  )
}

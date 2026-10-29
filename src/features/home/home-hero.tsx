import heroDots from '@/assets/figma/home/hero-dots.svg'
import { HOME_ARTWORK } from './home-artwork'

export function HomeHero() {
  const artwork = HOME_ARTWORK.sunglassesVarsity

  return (
    <section aria-labelledby="home-hero-title" className="page-container mt-8">
      <div className="flex min-h-[450px] items-center justify-between gap-8 lg:pl-10">
        <div className="flex max-w-[600px] flex-col items-end gap-11">
          <div className="flex w-full flex-col items-start gap-8">
            <div className="flex flex-col gap-1">
              <div className="flex flex-col gap-2">
                <p className="text-sm leading-4 font-medium tracking-[0.1em]">Bem-vindo à Kurio</p>
                <h1
                  id="home-hero-title"
                  className="text-[32px] leading-[1.6] font-bold uppercase lg:text-[43px] lg:leading-[70px]"
                >
                  Seja dono do futuro
                  <br />
                  da arte digital
                </h1>
              </div>
              <p className="max-w-[557px] text-sm leading-6 text-text-secondary">
                Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
                digital rara, apoie artistas e tenha uma parte da cultura da internet.
              </p>
            </div>
            <a
              href="#catalogo"
              className="flex h-10 w-[140px] items-center justify-center rounded-md bg-primary text-base leading-5 font-bold text-ink uppercase hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            >
              Explorar
            </a>
          </div>
          <img src={heroDots} alt="" aria-hidden="true" width={40} height={8} />
        </div>

        <img
          src={artwork.src}
          srcSet={artwork.srcSet}
          sizes="(min-width: 1024px) 450px, 300px"
          alt={artwork.alt}
          width={450}
          height={450}
          fetchPriority="high"
          className="size-[300px] shrink-0 rounded-3xl object-cover lg:size-[450px]"
        />
      </div>
    </section>
  )
}

import arrowRightIcon from '@/assets/figma/mobile/arrow-right.svg'
import heroDecoration from '@/assets/figma/mobile/hero-decoration.svg'
import heroDots from '@/assets/figma/mobile/hero-dots.svg'
import { HOME_ARTWORK } from './home-artwork'

export function MobileHomeHero() {
  const mainArtwork = HOME_ARTWORK.sunglassesVarsity
  const secondaryArtwork = HOME_ARTWORK.bucketHatHoodie

  return (
    <section
      aria-labelledby="mobile-hero-title"
      className="relative flex min-h-[190px] flex-col items-center justify-center gap-4 overflow-hidden rounded-[30px] p-4"
    >
      <img
        src={heroDecoration}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 size-full max-w-none"
      />
      <div className="relative flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <p className="text-xs leading-4 font-medium">Bem-vindo à Kurio</p>
          <h1 id="mobile-hero-title" className="w-[190px] text-lg leading-[29px] font-bold uppercase">
            Seja dono da cultura digital
          </h1>
          <p className="text-xs leading-[18px] text-text-secondary">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <a
            href="#catalogo"
            className="flex items-center gap-2 text-xs leading-[14px] font-bold text-text-accent uppercase"
          >
            Explorar
            <img src={arrowRightIcon} alt="" width={10} height={12} className="-rotate-90" />
          </a>
        </div>
        <div className="relative size-[138px] shrink-0">
          <img
            src={mainArtwork.src}
            srcSet={mainArtwork.srcSet}
            sizes="138px"
            alt={mainArtwork.alt}
            width={138}
            height={138}
            fetchPriority="high"
            className="size-[138px] rounded-2xl object-cover"
          />
          <img
            src={secondaryArtwork.src}
            sizes="58px"
            alt=""
            width={58}
            height={58}
            className="absolute top-[88px] left-[14px] size-[58px] rounded-2xl object-cover"
          />
        </div>
      </div>
      <img src={heroDots} alt="" aria-hidden="true" width={33} height={7} className="relative" />
    </section>
  )
}

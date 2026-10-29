import { Link } from '@tanstack/react-router'
import heartIcon from '@/assets/figma/mobile/heart.svg'
import homeIcon from '@/assets/figma/mobile/home.svg'
import scanPartCenterLine from '@/assets/figma/mobile/scan-part-1.svg'
import scanPartBottomLeft from '@/assets/figma/mobile/scan-part-2.svg'
import scanPartTopRight from '@/assets/figma/mobile/scan-part-3.svg'
import scanPartBottomRight from '@/assets/figma/mobile/scan-part-4.svg'
import scanPartTopLeft from '@/assets/figma/mobile/scan-part-5.svg'
import shopIcon from '@/assets/figma/mobile/shop.svg'
import tabBarBackground from '@/assets/figma/mobile/tab-bar-background.svg'
import tabBarCenter from '@/assets/figma/mobile/tab-bar-center.svg'
import userIcon from '@/assets/figma/mobile/user.svg'

const COMING_SOON_LABEL = 'disponível em breve'

// Scan icon parts positioned relative to their 27×24 group, converted from the Figma frame.
const SCAN_ICON_PARTS = [
  { src: scanPartCenterLine, className: 'inset-[46.3%_0_46.3%_0]' },
  { src: scanPartBottomLeft, className: 'inset-[57%_56.5%_0_4.9%]' },
  { src: scanPartTopRight, className: 'inset-[0.3%_4.9%_56.7%_56.3%]' },
  { src: scanPartBottomRight, className: 'inset-[57.1%_5.2%_0.2%_56.3%]' },
  { src: scanPartTopLeft, className: 'inset-[0_56.3%_57%_4.9%]' },
]

function UnavailableTab({ label, icon, className }: { label: string; icon: string; className: string }) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-label={`${label} (${COMING_SOON_LABEL})`}
      className={`absolute top-[71px] grid size-5 place-items-center ${className}`}
    >
      <img src={icon} alt="" width={20} height={20} />
    </button>
  )
}

export function MobileTabBar() {
  return (
    <nav aria-label="Navegação inferior" className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="relative mx-auto h-[126px] w-full max-w-[414px]">
        <div aria-hidden="true" className="absolute inset-x-0 top-[31px] bottom-0">
          <div className="absolute inset-[-42.13%_-7.25%_-21.06%_-7.25%]">
            <img src={tabBarBackground} alt="" className="block size-full max-w-none" />
          </div>
        </div>

        <Link
          to="/"
          aria-label="Início"
          activeOptions={{ exact: true, includeSearch: false }}
          className="absolute top-[71px] left-[8.7%] size-5"
        >
          <img src={homeIcon} alt="" className="absolute inset-[8.33%_10.42%] block" />
        </Link>
        <UnavailableTab label="Favoritos" icon={heartIcon} className="left-[26.09%]" />

        <button
          type="button"
          aria-disabled="true"
          aria-label={`Escanear (${COMING_SOON_LABEL})`}
          className="absolute top-0 left-1/2 size-[65px] -translate-x-1/2"
        >
          <img src={tabBarCenter} alt="" width={65} height={65} className="absolute inset-0" />
          <span aria-hidden="true" className="absolute top-[21px] left-1/2 h-6 w-[27px] -translate-x-1/2">
            {SCAN_ICON_PARTS.map((part) => (
              <img key={part.src} src={part.src} alt="" className={`absolute block ${part.className}`} />
            ))}
          </span>
        </button>

        <UnavailableTab label="Carrinho" icon={shopIcon} className="left-[70.53%]" />
        <UnavailableTab label="Perfil" icon={userIcon} className="left-[85.51%]" />
      </div>
    </nav>
  )
}

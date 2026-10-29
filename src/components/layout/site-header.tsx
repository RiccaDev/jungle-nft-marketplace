import { Link } from '@tanstack/react-router'
import cartIcon from '@/assets/figma/header/cart.svg'
import logoutIcon from '@/assets/figma/header/logout.svg'
import { HeaderSearch } from './header-search'

const NAV_ITEM_CLASS =
  'flex flex-col gap-6 text-base whitespace-nowrap after:h-[3px] after:w-full after:bg-primary after:content-[\'\']'

const COMING_SOON_LABEL = 'Disponível em breve'

export function SiteHeader() {
  return (
    <header className="page-container pt-6 max-md:hidden">
      <div className="flex items-start justify-between gap-6">
        <Link
          to="/"
          className="shrink-0 pt-2 text-sm font-bold tracking-[0.1em] lg:w-40"
          aria-label="Kurio — início"
        >
          KURIO
        </Link>

        <nav aria-label="Principal">
          <ul className="flex gap-5 lg:gap-10">
            <li>
              <Link
                to="/"
                activeOptions={{ exact: true, includeSearch: false }}
                className={`${NAV_ITEM_CLASS} after:invisible data-[status=active]:font-bold data-[status=active]:text-text-accent data-[status=active]:after:visible`}
              >
                Início
              </Link>
            </li>
            <li>
              <Link
                to="/"
                hash="catalogo"
                activeOptions={{ includeHash: true }}
                className={`${NAV_ITEM_CLASS} after:invisible`}
              >
                Mercado
              </Link>
            </li>
            <li>
              <span aria-disabled="true" title={COMING_SOON_LABEL} className={`${NAV_ITEM_CLASS} after:invisible`}>
                Criadores
              </span>
            </li>
            <li>
              <span aria-disabled="true" title={COMING_SOON_LABEL} className={`${NAV_ITEM_CLASS} after:invisible`}>
                Aprenda
              </span>
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-3 lg:gap-7">
          <HeaderSearch />
          <button
            type="button"
            aria-disabled="true"
            aria-label="Carrinho (disponível em breve)"
            title={COMING_SOON_LABEL}
            className="grid size-9 place-items-center rounded-md"
          >
            <img src={cartIcon} alt="" width={24} height={24} />
          </button>
          <button
            type="button"
            aria-disabled="true"
            title={COMING_SOON_LABEL}
            className="flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-md bg-primary text-base font-medium text-ink"
          >
            <img src={logoutIcon} alt="" width={20} height={20} />
            Entrar
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="h-px bg-primary/40" />
    </header>
  )
}

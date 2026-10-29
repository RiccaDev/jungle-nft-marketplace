import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import paginationNextIcon from '@/assets/figma/catalog/pagination-next.svg'

const MAX_VISIBLE_PAGES = 5
const PAGE_ITEM_CLASS =
  'grid size-[35px] place-items-center rounded-[4px] text-lg leading-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'

function visiblePageNumbers(currentPage: number, totalPages: number) {
  const firstPage = Math.max(
    1,
    Math.min(currentPage - Math.floor(MAX_VISIBLE_PAGES / 2), totalPages - MAX_VISIBLE_PAGES + 1),
  )
  const lastPage = Math.min(totalPages, firstPage + MAX_VISIBLE_PAGES - 1)
  return Array.from({ length: lastPage - firstPage + 1 }, (_, index) => firstPage + index)
}

function scrollToCatalog() {
  document.getElementById('catalogo')?.scrollIntoView({ block: 'start' })
}

function PageLink({ page, className, children, label }: {
  page: number
  className?: string
  children: React.ReactNode
  label?: string
}) {
  return (
    <Link
      to="/"
      search={(previous) => ({ ...previous, page: page === 1 ? undefined : page })}
      resetScroll={false}
      activeOptions={{ exact: true }}
      onClick={scrollToCatalog}
      aria-label={label}
      className={cn(PAGE_ITEM_CLASS, 'border border-border hover:border-primary', className)}
    >
      {children}
    </Link>
  )
}

export function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação do catálogo" className="self-end">
      <ul className="flex items-center gap-2">
        {page > 1 && (
          <li>
            <PageLink page={page - 1} label="Página anterior">
              <img src={paginationNextIcon} alt="" width={12} height={7} className="rotate-90" />
            </PageLink>
          </li>
        )}
        {visiblePageNumbers(page, totalPages).map((pageNumber) => (
          <li key={pageNumber}>
            {pageNumber === page ? (
              <span
                aria-current="page"
                className={cn(PAGE_ITEM_CLASS, 'bg-primary font-bold text-ink')}
              >
                <span className="sr-only">Página </span>
                {pageNumber}
              </span>
            ) : (
              <PageLink page={pageNumber} label={`Página ${pageNumber}`}>
                {pageNumber}
              </PageLink>
            )}
          </li>
        ))}
        {page < totalPages && (
          <li>
            <PageLink page={page + 1} label="Próxima página">
              <img src={paginationNextIcon} alt="" width={12} height={7} className="-rotate-90" />
            </PageLink>
          </li>
        )}
      </ul>
    </nav>
  )
}

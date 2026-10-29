import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { hasActiveNftFilters, NFT_LIST_PAGE_SIZE } from '../nft-list-filters'
import { nftListQueryOptions } from '../nfts.api'
import { useCatalogFilters } from '../use-catalog-filters'
import { CatalogPagination } from './catalog-pagination'
import { NftGrid, NftGridSkeleton } from './nft-grid'

function resultsAnnouncement(totalItems: number) {
  if (totalItems === 0) return 'Nenhum NFT encontrado.'
  return totalItems === 1 ? '1 NFT encontrado.' : `${totalItems} NFTs encontrados.`
}

function CatalogMessage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-[300px] flex-col items-start justify-center gap-4 rounded-lg border border-border bg-surface-card p-8">
      <h3 className="text-lg font-bold">{title}</h3>
      {children}
    </div>
  )
}

export function CatalogResults() {
  const { filters, clearFilters } = useCatalogFilters()
  const nftList = useQuery(nftListQueryOptions(filters))

  const statusMessage = nftList.isFetching
    ? 'Carregando NFTs…'
    : nftList.data
      ? resultsAnnouncement(nftList.data.pagination.totalItems)
      : ''

  return (
    <div className="flex flex-col gap-10 md:gap-[88px]">
      <p role="status" className="sr-only" data-testid="catalog-status">
        {statusMessage}
      </p>

      {nftList.isPending && <NftGridSkeleton cardCount={NFT_LIST_PAGE_SIZE} />}

      {nftList.isError && (
        <CatalogMessage title="Não foi possível carregar os NFTs.">
          <p className="text-sm text-muted-foreground">
            Verifique sua conexão e tente novamente.
          </p>
          <Button onClick={() => void nftList.refetch()} disabled={nftList.isFetching}>
            {nftList.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        </CatalogMessage>
      )}

      {nftList.isSuccess && nftList.data.items.length === 0 && (
        nftList.data.pagination.totalItems === 0 ? (
          <CatalogMessage title="Nenhum NFT encontrado.">
            <p className="text-sm text-muted-foreground">
              Ajuste a busca ou os filtros para ver outros resultados.
            </p>
            {hasActiveNftFilters(filters) && <Button onClick={clearFilters}>Limpar filtros</Button>}
          </CatalogMessage>
        ) : (
          <CatalogMessage title="Esta página não existe.">
            <Button asChild>
              <Link to="/" search={(previous) => ({ ...previous, page: undefined })}>
                Ir para a primeira página
              </Link>
            </Button>
          </CatalogMessage>
        )
      )}

      {nftList.isSuccess && nftList.data.items.length > 0 && (
        <>
          <div
            aria-busy={nftList.isPlaceholderData}
            data-testid="nft-grid"
            className={cn('transition-opacity', nftList.isPlaceholderData && 'opacity-60')}
          >
            <NftGrid nfts={nftList.data.items} />
          </div>
          <CatalogPagination
            page={nftList.data.pagination.page}
            totalPages={nftList.data.pagination.totalPages}
          />
        </>
      )}
    </div>
  )
}

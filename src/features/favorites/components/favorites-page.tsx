import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { NftGrid, NftGridSkeleton } from '@/features/nfts/components/nft-grid'
import { favoritesQueryOptions } from '../favorites.api'

const SKELETON_CARD_COUNT = 3

export function FavoritesPage({ userId }: { userId: string }) {
  const favorites = useQuery(favoritesQueryOptions(userId))

  return (
    <section aria-labelledby="favorites-title" aria-busy={favorites.isPending} className="flex flex-col gap-6">
      <h2 id="favorites-title" className="text-lg font-bold text-text-accent">
        Meus favoritos
      </h2>

      {favorites.isPending && <NftGridSkeleton cardCount={SKELETON_CARD_COUNT} />}

      {favorites.isError && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">Não foi possível carregar seus favoritos.</p>
          <Button variant="outline" size="sm" onClick={() => void favorites.refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {favorites.isSuccess && favorites.data.length === 0 && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">Você ainda não favoritou nenhum NFT.</p>
          <Button asChild>
            <Link to="/" hash="catalogo">Explorar NFTs</Link>
          </Button>
        </div>
      )}

      {favorites.isSuccess && favorites.data.length > 0 && (
        <div data-testid="favorites-list">
          <NftGrid nfts={favorites.data} />
        </div>
      )}
    </section>
  )
}

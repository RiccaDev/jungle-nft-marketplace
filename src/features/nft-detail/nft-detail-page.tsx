import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import type { NftDetail, NftEditionTier } from '@/features/nfts/nft.contracts'
import { nftDetailQueryOptions } from '@/features/nfts/nfts.api'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import { hasHttpStatus } from '@/lib/http/api-error'
import { DesktopNftDetail } from './components/desktop-nft-detail'
import { MobileNftDetail } from './components/mobile-nft-detail'
import { NftDetailMessage } from './components/nft-detail-message'
import { NftDetailSkeleton } from './components/nft-detail-skeleton'
import { useCartQuantityLookup, useNftDetailActions } from './nft-detail-actions'
import { useNftChangeNotice } from './use-nft-change-notice'
import { useNftPurchaseSelection } from './use-nft-purchase-selection'

const nftDetailRoute = getRouteApi('/nfts/$nftId')

type NftDetailContentProps = {
  nft: NftDetail
  urlEditionTier: NftEditionTier | undefined
  isDesktop: boolean
}

function NftDetailContent({ nft, urlEditionTier, isDesktop }: NftDetailContentProps) {
  const navigate = nftDetailRoute.useNavigate()
  const changeNotice = useNftChangeNotice(nft)
  const selection = useNftPurchaseSelection({
    nft,
    urlEditionTier,
    onEditionTierChange: (edition) =>
      void navigate({ search: { edition }, replace: true, resetScroll: false }),
    getQuantityInCart: useCartQuantityLookup(nft.id),
  })
  const { cart, favorite } = useNftDetailActions({
    nftId: nft.id,
    editionTier: selection.selectedEditionTier,
    quantity: selection.quantity,
    onAdded: selection.resetQuantity,
  })

  const Layout = isDesktop ? DesktopNftDetail : MobileNftDetail
  return <Layout nft={nft} selection={selection} cart={cart} favorite={favorite} changeNotice={changeNotice} />
}

export function NftDetailPage() {
  const { nftId } = nftDetailRoute.useParams()
  const { edition } = nftDetailRoute.useSearch()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const nftDetail = useQuery(nftDetailQueryOptions(nftId))

  if (nftDetail.isPending) {
    return (
      <div className={isDesktop ? 'page-container mt-8' : undefined}>
        <NftDetailSkeleton variant={isDesktop ? 'desktop' : 'mobile'} />
      </div>
    )
  }

  if (nftDetail.isError) {
    return hasHttpStatus(nftDetail.error, 404) ? (
      <NftDetailMessage
        title="NFT não encontrado"
        description="O NFT procurado não existe ou foi removido do mercado."
      />
    ) : (
      <NftDetailMessage
        title="Não foi possível carregar este NFT."
        description="Verifique sua conexão e tente novamente."
        action={
          <Button onClick={() => void nftDetail.refetch()} disabled={nftDetail.isFetching}>
            {nftDetail.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
          </Button>
        }
      />
    )
  }

  // Keyed by id so selection state never leaks between NFTs (e.g. via related links).
  return <NftDetailContent key={nftId} nft={nftDetail.data} urlEditionTier={edition} isDesktop={isDesktop} />
}

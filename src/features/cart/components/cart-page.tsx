import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BackButton } from '@/components/back-button'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { NftCard } from '@/features/nfts/components/nft-card'
import { nftListQueryOptions } from '@/features/nfts/nfts.api'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import type { Cart } from '../cart.contracts'
import { findQuoteLine } from '../checkout-readiness'
import { useCart, useCartQuote } from '../use-cart'
import { useCartChangeNotices } from '../use-cart-change-notices'
import { CartItemCard, CartTableRow } from './cart-line'
import { CartSummary } from './cart-summary'

const RELATED_NFT_COUNT = 5

function CartBreadcrumb() {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex gap-1 text-[15px] leading-4 font-bold">
        <li>
          <Link to="/" className="hover:text-text-accent">Início</Link>
          <span aria-hidden="true"> /</span>
        </li>
        <li>
          <Link to="/" hash="catalogo" className="hover:text-text-accent">Mercado</Link>
          <span aria-hidden="true"> /</span>
        </li>
        <li aria-current="page">Carrinho</li>
      </ol>
    </nav>
  )
}

function RelatedNfts() {
  const trending = useQuery(nftListQueryOptions({ segment: 'trending' }))
  const nfts = trending.data?.items.slice(0, RELATED_NFT_COUNT) ?? []
  if (nfts.length === 0) return null

  return (
    <section aria-labelledby="cart-related-title" className="flex flex-col gap-8">
      <h2 id="cart-related-title" className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
        Colecionadores também viram
      </h2>
      <ul className="grid grid-cols-3 gap-x-[26px] gap-y-8 lg:grid-cols-5">
        {nfts.map((nft) => (
          <li key={nft.id}>
            <NftCard nft={nft} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function CartLoadingSkeleton() {
  return (
    <div aria-hidden="true" data-testid="cart-skeleton" className="flex flex-col gap-6 md:flex-row md:gap-[86px]">
      <div className="flex flex-1 flex-col gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[100px] rounded-[20px] md:h-[70px] md:rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-[320px] rounded-lg md:w-[332px]" />
    </div>
  )
}

function CartChangeNotices({ notices, onDismiss }: { notices: string[]; onDismiss: () => void }) {
  if (notices.length === 0) return null
  return (
    <div role="status" data-testid="cart-change-notices" className="flex flex-col gap-1 rounded-md border border-primary/60 bg-surface-card px-4 py-3 text-sm">
      <p className="font-bold text-text-accent">Valores atualizados enquanto você navegava:</p>
      <ul className="list-disc pl-5">
        {notices.map((notice) => (
          <li key={notice}>{notice}</li>
        ))}
      </ul>
      <button type="button" onClick={onDismiss} className="self-end text-text-secondary hover:text-foreground">
        Dispensar
      </button>
    </div>
  )
}

function CartContent({ cart, isDesktop }: { cart: Cart; isDesktop: boolean }) {
  const quote = useCartQuote(cart)

  if (isDesktop) {
    return (
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-[86px]">
        <table className="w-full lg:max-w-[782px]">
          <caption className="sr-only">Itens do carrinho</caption>
          <thead>
            <tr className="border-b border-primary/40 text-left text-[15px] font-bold">
              <th scope="col" className="pb-3 font-bold">NFTs</th>
              <th scope="col" className="pb-3 font-bold">Preço</th>
              <th scope="col" className="pb-3 font-bold">Quantidade</th>
              <th scope="col" className="pb-3 font-bold">Total</th>
              <th scope="col" className="pb-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {cart.items.map((item) => (
              <CartTableRow key={item.id} item={item} quoteLine={findQuoteLine(quote.data, item)} />
            ))}
          </tbody>
        </table>
        <div className="w-full shrink-0 lg:w-[332px]">
          <CartSummary cart={cart} quote={quote} variant="desktop" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-5" aria-label="Itens do carrinho">
        {cart.items.map((item) => (
          <CartItemCard key={item.id} item={item} quoteLine={findQuoteLine(quote.data, item)} />
        ))}
      </ul>
      <div className="-mx-6 rounded-t-[40px] bg-surface-card px-6 pt-6 pb-8">
        <CartSummary cart={cart} quote={quote} variant="mobile" />
      </div>
    </div>
  )
}

export function CartPage() {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const cart = useCart()
  const { notices, dismissNotices } = useCartChangeNotices(cart.data)

  return (
    <div className="page-container mt-8 flex flex-col gap-24 max-md:mt-8">
      <div className="flex flex-col gap-3 max-md:gap-5">
        {isDesktop ? (
          <>
            <CartBreadcrumb />
            <h1 className="sr-only">Carrinho de NFTs</h1>
          </>
        ) : (
          <div className="relative flex h-11 items-center justify-center">
            <div className="absolute left-0">
              <BackButton />
            </div>
            <h1 className="text-xl leading-4 font-bold">Carrinho de NFTs</h1>
          </div>
        )}

        <CartChangeNotices notices={notices} onDismiss={dismissNotices} />

        {cart.isPending && <CartLoadingSkeleton />}

        {cart.isError && (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface-card p-8">
            <h2 className="text-lg font-bold">Não foi possível carregar o carrinho.</h2>
            <p className="text-sm text-muted-foreground">Verifique sua conexão e tente novamente.</p>
            <Button onClick={() => void cart.refetch()} disabled={cart.isFetching}>
              {cart.isFetching ? 'Tentando novamente…' : 'Tentar novamente'}
            </Button>
          </div>
        )}

        {cart.isSuccess && cart.data.items.length === 0 && (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-border bg-surface-card p-8">
            <h2 className="text-lg font-bold">Seu carrinho está vazio.</h2>
            <p className="text-sm text-muted-foreground">Explore o catálogo e adicione NFTs para vê-los aqui.</p>
            <Button asChild>
              <Link to="/" hash="catalogo">Explorar NFTs</Link>
            </Button>
          </div>
        )}

        {cart.isSuccess && cart.data.items.length > 0 && <CartContent cart={cart.data} isDesktop={isDesktop} />}
      </div>

      {isDesktop && <RelatedNfts />}
    </div>
  )
}

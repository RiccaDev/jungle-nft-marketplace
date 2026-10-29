import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import { cn } from 'cn'
import type { RouterContext } from '@/app/router'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { useIsAuthRoute, useIsMarketRoute } from '@/components/layout/use-is-market-route'
import { NoticeBanner } from '@/components/notice-banner'
import { Button } from '@/components/ui/button'
import { SessionExpiredBanner } from '@/features/auth/components/session-expired-banner'
import { useSessionLifecycle } from '@/features/auth/use-session-lifecycle'
import { useCartRealtimeSync } from '@/features/cart/use-cart-realtime-sync'
import { useCartSessionSync } from '@/features/cart/use-cart-session-sync'
import { useNftRealtimeSync } from '@/features/nfts/use-nft-realtime-sync'
import { useOrderRealtimeSync } from '@/features/orders/use-order-realtime-sync'
import { useRealtimeConnection } from '@/lib/realtime/use-socket-connection'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  useRealtimeConnection()
  useNftRealtimeSync()
  useCartRealtimeSync()
  useOrderRealtimeSync()
  const { hasExpiredSessionNotice, dismissExpiredSessionNotice } = useSessionLifecycle()
  const { mergeNotice, dismissMergeNotice } = useCartSessionSync()
  const isMarketRoute = useIsMarketRoute()
  const isAuthRoute = useIsAuthRoute()

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      {hasExpiredSessionNotice && !isAuthRoute && (
        <SessionExpiredBanner onDismiss={dismissExpiredSessionNotice} />
      )}
      {mergeNotice && <NoticeBanner onDismiss={dismissMergeNotice}>{mergeNotice}</NoticeBanner>}
      <main id="conteudo" className={cn('md:pb-0', isMarketRoute ? 'pb-[200px]' : 'pb-[150px]')}>
        <Outlet />
      </main>
      <SiteFooter />
      <MobileTabBar />
    </>
  )
}

function NotFound() {
  return (
    <div className="page-container flex min-h-[50vh] flex-col items-start justify-center gap-4 py-16">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground">O endereço acessado não existe.</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  )
}

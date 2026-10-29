import { createRootRouteWithContext, Link, Outlet } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'
import { MobileTabBar } from '@/components/layout/mobile-tab-bar'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteHeader } from '@/components/layout/site-header'
import { Button } from '@/components/ui/button'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <SiteHeader />
      <main id="conteudo" className="pb-[150px] md:pb-0">
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

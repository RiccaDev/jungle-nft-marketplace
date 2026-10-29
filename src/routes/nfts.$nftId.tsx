import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

// Placeholder until the NFT detail step: keeps catalog links navigable without faking content.
export const Route = createFileRoute('/nfts/$nftId')({
  component: NftDetailPlaceholderPage,
})

function NftDetailPlaceholderPage() {
  const { nftId } = Route.useParams()

  return (
    <div className="page-container flex min-h-[50vh] flex-col items-start justify-center gap-4 py-16">
      <h1 className="text-2xl font-bold">Detalhes do NFT</h1>
      <p className="text-muted-foreground">
        A página de detalhes de <span className="text-foreground">{nftId}</span> ainda está em
        construção.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao catálogo</Link>
      </Button>
    </div>
  )
}

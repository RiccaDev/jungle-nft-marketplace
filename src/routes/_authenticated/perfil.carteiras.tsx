import { createFileRoute } from '@tanstack/react-router'
import { WalletManagerPage } from '@/features/wallets/components/wallet-manager-page'

export const Route = createFileRoute('/_authenticated/perfil/carteiras')({
  component: WalletsRoute,
})

function WalletsRoute() {
  const { sessionUser } = Route.useRouteContext()
  return <WalletManagerPage key={sessionUser.id} userId={sessionUser.id} />
}

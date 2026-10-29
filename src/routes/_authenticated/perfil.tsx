import { createFileRoute } from '@tanstack/react-router'
import { AccountPage } from '@/features/account/account-page'

export const Route = createFileRoute('/_authenticated/perfil')({
  component: ProfileRoute,
})

function ProfileRoute() {
  const { sessionUser } = Route.useRouteContext()
  return <AccountPage userId={sessionUser.id} />
}

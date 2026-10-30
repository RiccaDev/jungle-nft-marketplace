import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/features/favorites/components/favorites-page'

export const Route = createFileRoute('/_authenticated/perfil/favoritos')({
  component: FavoritesRoute,
})

function FavoritesRoute() {
  const { sessionUser } = Route.useRouteContext()
  return <FavoritesPage key={sessionUser.id} userId={sessionUser.id} />
}

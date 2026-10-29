import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ProfileLayout } from '@/features/account/components/profile-layout'

export const Route = createFileRoute('/_authenticated/perfil')({
  component: ProfileRoute,
})

function ProfileRoute() {
  const { sessionUser } = Route.useRouteContext()
  // Keyed by user: a session switch never carries form state across accounts.
  return (
    <ProfileLayout key={sessionUser.id} userId={sessionUser.id}>
      <Outlet />
    </ProfileLayout>
  )
}

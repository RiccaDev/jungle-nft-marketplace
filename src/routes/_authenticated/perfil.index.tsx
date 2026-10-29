import { createFileRoute } from '@tanstack/react-router'
import { ProfileSettingsPage } from '@/features/account/components/profile-settings-page'

export const Route = createFileRoute('/_authenticated/perfil/')({
  component: ProfileSettingsRoute,
})

function ProfileSettingsRoute() {
  const { sessionUser } = Route.useRouteContext()
  return <ProfileSettingsPage key={sessionUser.id} userId={sessionUser.id} />
}

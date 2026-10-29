import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/features/checkout/components/checkout-page'

export const Route = createFileRoute('/_authenticated/pagamento')({
  component: CheckoutRoute,
})

function CheckoutRoute() {
  const { sessionUser } = Route.useRouteContext()
  // Keyed by user: a session switch never carries form state or accepted values across accounts.
  return <CheckoutPage key={sessionUser.id} user={sessionUser} />
}

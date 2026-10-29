import { createFileRoute } from '@tanstack/react-router'
import { OrderHistoryPage } from '@/features/orders/components/order-history-page'

export const Route = createFileRoute('/_authenticated/perfil/pedidos')({
  component: OrdersRoute,
})

function OrdersRoute() {
  const { sessionUser } = Route.useRouteContext()
  return <OrderHistoryPage key={sessionUser.id} userId={sessionUser.id} />
}

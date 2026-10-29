import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/orders/components/order-page'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  component: OrderRoute,
})

function OrderRoute() {
  const { sessionUser } = Route.useRouteContext()
  const { orderId } = Route.useParams()
  return <OrderPage key={sessionUser.id} userId={sessionUser.id} orderId={orderId} />
}

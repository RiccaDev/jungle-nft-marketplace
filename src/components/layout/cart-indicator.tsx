import { Link } from '@tanstack/react-router'
import cartIcon from '@/assets/figma/header/cart.svg'
import cartBadge from '@/assets/figma/header/cart-badge.svg'
import { useCart } from '@/features/cart/use-cart'

const MAX_BADGE_COUNT = 99

export function CartIndicator() {
  const cart = useCart()
  const itemCount = cart.data?.items.reduce((total, item) => total + item.quantity, 0) ?? 0
  const label = itemCount === 1 ? 'Carrinho (1 item)' : `Carrinho (${itemCount} itens)`

  return (
    <Link
      to="/carrinho"
      aria-label={label}
      className="relative grid size-9 place-items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <img src={cartIcon} alt="" width={24} height={24} />
      {itemCount > 0 && (
        <span aria-hidden="true" className="absolute top-0.5 right-0 grid size-5 place-items-center">
          <img src={cartBadge} alt="" width={20} height={20} className="absolute inset-0" />
          <span data-testid="cart-badge" className="relative text-[10px] leading-none font-medium text-ink">
            {Math.min(itemCount, MAX_BADGE_COUNT)}
          </span>
        </span>
      )}
    </Link>
  )
}

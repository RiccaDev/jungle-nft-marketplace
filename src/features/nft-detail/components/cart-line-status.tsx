import { Link } from '@tanstack/react-router'
import type { NftCartActions } from '../nft-detail-actions'

export function CartLineStatus({ cart }: { cart: NftCartActions }) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      {cart.quantityInCart > 0 && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span data-testid="nft-cart-quantity">No carrinho: {cart.quantityInCart}</span>
          <Link to="/carrinho" className="font-bold text-text-accent hover:underline">
            Ver carrinho
          </Link>
          <button
            type="button"
            onClick={cart.removeFromCart}
            disabled={cart.isRemoving}
            className="text-text-secondary underline-offset-2 hover:text-foreground hover:underline disabled:opacity-60"
          >
            {cart.isRemoving ? 'Removendo…' : 'Remover do carrinho'}
          </button>
        </p>
      )}
      <p role="status" className="text-text-accent empty:hidden">
        {cart.addedMessage}
      </p>
      <p role="alert" className="text-text-coral empty:hidden">
        {cart.errorMessage}
      </p>
    </div>
  )
}

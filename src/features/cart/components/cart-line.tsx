import { Link } from '@tanstack/react-router'
import { Trash2Icon } from 'lucide-react'
import { QuantityStepper } from '@/components/quantity-stepper'
import { Skeleton } from '@/components/ui/skeleton'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'
import { formatEth } from '@/lib/eth/eth-amount'
import { maxCartLineQuantity, type CartItem, type CartQuoteLine } from '../cart.contracts'
import { isQuoteLineCurrent } from '../checkout-readiness'
import { useCartLineActions } from '../use-cart-line-actions'

type CartLineProps = {
  item: CartItem
  quoteLine: CartQuoteLine | undefined
}

type LineActions = ReturnType<typeof useCartLineActions>

function editionLabel(item: CartItem) {
  return NFT_EDITION_LABELS[item.editionTier]
}

function LineArtwork({ item, className }: { item: CartItem; className: string }) {
  return (
    <img
      src={item.nft.image.src}
      srcSet={item.nft.image.srcSet}
      sizes="100px"
      alt={item.nft.image.alt}
      width={100}
      height={100}
      loading="lazy"
      className={className}
    />
  )
}

function LineName({ item }: { item: CartItem }) {
  return (
    <Link
      to="/nfts/$nftId"
      params={{ nftId: item.nftId }}
      search={{ edition: item.editionTier }}
      className="line-clamp-2 text-base leading-5 hover:text-text-accent"
    >
      {item.nft.name}
    </Link>
  )
}

// Line totals always come from the API quote; until it matches this line, nothing is shown.
function LineTotal({ item, quoteLine }: CartLineProps) {
  if (!quoteLine || !isQuoteLineCurrent(item, quoteLine)) {
    return <Skeleton className="h-4 w-20" />
  }
  return <span data-testid="cart-line-total">{formatEth(quoteLine.lineTotalEth)}</span>
}

function LineQuantity({ item, actions }: { item: CartItem; actions: LineActions }) {
  return (
    <QuantityStepper
      size="compact"
      quantity={item.quantity}
      maxQuantity={maxCartLineQuantity(item.nft)}
      onDecrease={() => actions.setQuantity(item.quantity - 1)}
      onIncrease={() => actions.setQuantity(item.quantity + 1)}
    />
  )
}

function LineRemoveButton({ item, actions }: { item: CartItem; actions: LineActions }) {
  return (
    <button
      type="button"
      onClick={actions.remove}
      disabled={actions.isRemoving}
      aria-label={`Remover ${item.nft.name} (${editionLabel(item)}) do carrinho`}
      className="grid size-8 shrink-0 place-items-center rounded-md text-text-secondary hover:text-text-coral focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
    >
      <Trash2Icon aria-hidden="true" className="size-5" />
    </button>
  )
}

function LineMessages({ item, quoteLine, actions }: CartLineProps & { actions: LineActions }) {
  const maxQuantity = maxCartLineQuantity(item.nft)
  const issue = isQuoteLineCurrent(item, quoteLine) ? quoteLine?.issue : null

  return (
    <>
      {issue === 'sold-out' && (
        <p className="text-sm font-bold text-text-coral">Edição esgotada. Remova o item para continuar.</p>
      )}
      {issue === 'insufficient-stock' && (
        <p className="flex flex-wrap items-center gap-x-2 text-sm font-bold text-text-coral">
          Restam {maxQuantity} disponíveis nesta edição.
          <button
            type="button"
            onClick={() => actions.setQuantity(maxQuantity)}
            className="text-text-accent underline underline-offset-2"
          >
            Ajustar para {maxQuantity}
          </button>
        </p>
      )}
      <p role="alert" className="text-sm text-text-coral empty:hidden">
        {actions.errorMessage}
      </p>
    </>
  )
}

export function CartTableRow({ item, quoteLine }: CartLineProps) {
  const actions = useCartLineActions(item)

  return (
    <tr data-testid="cart-line" className="align-middle">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-4">
          <LineArtwork item={item} className="size-[70px] shrink-0 rounded-lg object-cover" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <LineName item={item} />
            <p className="text-[15px] leading-4 text-brand-secondary">
              Edição: {editionLabel(item)} · ID {item.nft.tokenId}
            </p>
            <LineMessages item={item} quoteLine={quoteLine} actions={actions} />
          </div>
        </div>
      </td>
      <td className="py-3 pr-4 text-base leading-4 font-bold text-text-accent">
        <span data-testid="cart-unit-price">{formatEth(item.nft.priceEth)}</span>
      </td>
      <td className="py-3 pr-4">
        <LineQuantity item={item} actions={actions} />
      </td>
      <td className="py-3 pr-4 text-base leading-4 font-bold text-text-accent">
        <LineTotal item={item} quoteLine={quoteLine} />
      </td>
      <td className="py-3 text-right">
        <LineRemoveButton item={item} actions={actions} />
      </td>
    </tr>
  )
}

export function CartItemCard({ item, quoteLine }: CartLineProps) {
  const actions = useCartLineActions(item)

  return (
    <li data-testid="cart-line" className="flex flex-col gap-2">
      <div className="flex min-h-[100px] items-center gap-2 overflow-hidden rounded-[20px] bg-surface-card pr-3">
        <LineArtwork item={item} className="size-[100px] shrink-0 rounded-[20px] object-cover" />
        <div className="flex min-w-0 flex-1 flex-col gap-2 py-3">
          <LineName item={item} />
          <p className="text-[15px] leading-4 text-brand-secondary">Edição: {editionLabel(item)}</p>
          <div className="text-base leading-4 font-bold text-text-accent">
            <LineTotal item={item} quoteLine={quoteLine} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <LineRemoveButton item={item} actions={actions} />
          <LineQuantity item={item} actions={actions} />
        </div>
      </div>
      <LineMessages item={item} quoteLine={quoteLine} actions={actions} />
    </li>
  )
}

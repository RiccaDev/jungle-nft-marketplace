import { cn } from 'cn'
import { HeartIcon } from 'lucide-react'
import type { NftSummary } from '@/features/nfts/nft.contracts'
import { useToggleFavorite } from '../use-favorites'

type FavoriteButtonProps = {
  nft: NftSummary
  variant: 'icon' | 'labeled'
  className?: string
}

// A toggle keeps a constant name; the state is exposed by aria-pressed and the filled heart.
export function FavoriteButton({ nft, variant, className }: FavoriteButtonProps) {
  const favorite = useToggleFavorite(nft)

  return (
    <span className={cn('relative inline-flex flex-col items-end', variant === 'icon' && 'z-10', className)}>
      <button
        type="button"
        aria-pressed={favorite.isFavorite}
        aria-label={variant === 'icon' ? `Favoritar ${nft.name}` : undefined}
        aria-busy={favorite.isBusy}
        // aria-disabled instead of disabled keeps keyboard focus on the toggle while it saves.
        aria-disabled={favorite.isBusy}
        onClick={() => !favorite.isBusy && favorite.toggle()}
        data-testid="favorite-button"
        className={cn(
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-disabled:cursor-wait',
          variant === 'icon'
            ? 'grid size-[35px] place-items-center rounded-full border border-border bg-surface-raised'
            : 'flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border border-primary text-sm leading-5 font-medium text-text-accent',
        )}
      >
        <HeartIcon
          aria-hidden="true"
          className={cn('text-text-accent', variant === 'icon' ? 'size-4' : 'size-5', favorite.isFavorite && 'fill-current')}
        />
        {variant === 'labeled' && 'Favoritar'}
      </button>
      <span
        role="alert"
        className={cn('text-xs text-text-coral empty:hidden', variant === 'icon' ? 'sr-only' : 'mt-1 max-w-[260px] text-right')}
      >
        {favorite.errorMessage}
      </span>
    </span>
  )
}

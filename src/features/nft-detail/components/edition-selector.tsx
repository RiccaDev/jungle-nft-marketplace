import { cn } from 'cn'
import { useId } from 'react'
import type { NftEdition, NftEditionTier } from '@/features/nfts/nft.contracts'
import { NFT_EDITION_LABELS } from '@/features/nfts/nft-labels'

type EditionSelectorProps = {
  editions: NftEdition[]
  selectedTier: NftEditionTier | undefined
  onSelect: (tier: NftEditionTier) => void
  className?: string
}

export function EditionSelector({ editions, selectedTier, onSelect, className }: EditionSelectorProps) {
  const groupName = useId()

  return (
    <fieldset className={cn('flex flex-col gap-2 md:gap-3', className)}>
      <legend className="mb-2 text-[15px] leading-4 font-bold md:mb-3">Edição:</legend>
      <div className="flex flex-wrap gap-3 md:gap-1.5">
        {editions.map((edition) => {
          const isSelected = edition.tier === selectedTier
          const isSoldOut = edition.availableQuantity === 0

          return (
            <label
              key={edition.tier}
              className={cn(
                'relative flex h-7 min-w-9 items-center justify-center rounded-full border px-2 text-sm leading-4 uppercase',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                isSelected ? 'border-primary font-medium text-text-accent' : 'border-border text-text-secondary',
                isSoldOut ? 'cursor-not-allowed line-through opacity-50' : 'cursor-pointer hover:border-primary/70',
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={edition.tier}
                checked={isSelected}
                disabled={isSoldOut}
                onChange={() => onSelect(edition.tier)}
                className="absolute inset-0 size-full cursor-[inherit] appearance-none opacity-0"
              />
              {NFT_EDITION_LABELS[edition.tier]}
              {isSoldOut && <span className="sr-only"> (esgotada)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

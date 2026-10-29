import { useState } from 'react'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { ethToHundredths, formatEth, hundredthsToEth } from '@/lib/eth/eth-amount'

type PriceRange = { min: string; max: string }

type PriceRangeFilterProps = {
  bounds: PriceRange | undefined
  minPrice: string | undefined
  maxPrice: string | undefined
  onApply: (range: { minPrice?: string; maxPrice?: string }) => void
}

function formatPriceRangeLabel([lowerHundredths, upperHundredths]: number[]) {
  return `${hundredthsToEth(lowerHundredths ?? 0)} - ${formatEth(hundredthsToEth(upperHundredths ?? 0))}`
}

export function PriceRangeFilter({ bounds, minPrice, maxPrice, onApply }: PriceRangeFilterProps) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-lg leading-4 font-bold">Faixa de preço</legend>
      {bounds ? (
        <PriceRangeControls
          // Remount when the applied range changes (e.g. history navigation) to resync the draft.
          key={`${minPrice}:${maxPrice}:${bounds.min}:${bounds.max}`}
          bounds={bounds}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onApply={onApply}
        />
      ) : (
        <div className="flex flex-col gap-3 pl-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
    </fieldset>
  )
}

function PriceRangeControls({
  bounds,
  minPrice,
  maxPrice,
  onApply,
}: PriceRangeFilterProps & { bounds: PriceRange }) {
  const lowestHundredths = ethToHundredths(bounds.min)
  const highestHundredths = ethToHundredths(bounds.max)
  const [draftRange, setDraftRange] = useState([
    minPrice ? ethToHundredths(minPrice) : lowestHundredths,
    maxPrice ? ethToHundredths(maxPrice) : highestHundredths,
  ])

  function applyDraftRange() {
    const [lowerHundredths = lowestHundredths, upperHundredths = highestHundredths] = draftRange
    onApply({
      minPrice: lowerHundredths > lowestHundredths ? hundredthsToEth(lowerHundredths) : undefined,
      maxPrice: upperHundredths < highestHundredths ? hundredthsToEth(upperHundredths) : undefined,
    })
  }

  return (
    <div className="flex flex-col items-start gap-3 pl-3">
      <Slider
        min={lowestHundredths}
        max={highestHundredths}
        step={1}
        minStepsBetweenThumbs={1}
        value={draftRange}
        onValueChange={setDraftRange}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        formatValueText={(hundredths) => formatEth(hundredthsToEth(hundredths))}
      />
      <p className="text-[15px]" aria-live="polite">
        Preço: {formatPriceRangeLabel(draftRange)}
      </p>
      <button
        type="button"
        onClick={applyDraftRange}
        className="rounded-md bg-primary px-3 py-2 text-base leading-5 font-bold text-ink hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
      >
        Aplicar
      </button>
    </div>
  )
}

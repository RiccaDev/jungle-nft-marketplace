import { CheckIcon } from 'lucide-react'
import { cn } from 'cn'
import { Skeleton } from '@/components/ui/skeleton'
import type { FacetCount } from '../nft.contracts'

type FilterOptionListProps<Id extends string> = {
  title: string
  optionIds: readonly Id[]
  labels: Record<Id, string>
  selectedIds: readonly Id[] | undefined
  facets: FacetCount<Id>[] | undefined
  onSelectionChange: (selectedIds: Id[] | undefined) => void
  isCountBold?: boolean
}

export function FilterOptionList<Id extends string>({
  title,
  optionIds,
  labels,
  selectedIds = [],
  facets,
  onSelectionChange,
  isCountBold = false,
}: FilterOptionListProps<Id>) {
  function toggleOption(optionId: Id) {
    const nextSelection = selectedIds.includes(optionId)
      ? selectedIds.filter((selectedId) => selectedId !== optionId)
      : [...selectedIds, optionId]
    onSelectionChange(nextSelection.length > 0 ? nextSelection : undefined)
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-lg leading-4 font-bold">{title}</legend>
      <ul className="flex flex-col px-3">
        {optionIds.map((optionId) => {
          const isSelected = selectedIds.includes(optionId)
          const count = facets?.find((facet) => facet.id === optionId)?.count

          return (
            <li key={optionId}>
              <label
                className={cn(
                  'relative flex cursor-pointer items-center justify-between gap-3 rounded-sm text-[15px] leading-10 text-text-secondary hover:text-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
                  isSelected && 'text-text-accent hover:text-text-accent',
                )}
              >
                <span className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOption(optionId)}
                    className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
                  />
                  <CheckIcon
                    aria-hidden="true"
                    className={cn('absolute -left-3.5 size-3', !isSelected && 'invisible')}
                  />
                  {labels[optionId]}
                </span>
                {count === undefined ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  <span className={cn('text-right', isCountBold && 'font-bold')}>
                    <span className="sr-only">, </span>({count})
                  </span>
                )}
              </label>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}

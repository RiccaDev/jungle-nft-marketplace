import { useId, useRef, useState } from 'react'
import searchIcon from '@/assets/figma/header/search.svg'
import { useCatalogSearchInput } from '@/features/nfts/use-catalog-search-input'

// The desktop design only shows a search icon; it expands into the catalog search field.
export function HeaderSearch() {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const { value, changeValue } = useCatalogSearchInput()
  const [isExpanded, setIsExpanded] = useState(false)
  const isOpen = isExpanded || value !== ''

  function openSearch() {
    setIsExpanded(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div role="search" className="flex items-center gap-2">
      {isOpen && (
        <>
          <label htmlFor={inputId} className="sr-only">
            Buscar NFTs
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="search"
            value={value}
            onChange={(event) => changeValue(event.target.value)}
            onBlur={() => setIsExpanded(false)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                changeValue('')
                setIsExpanded(false)
              }
            }}
            placeholder="Buscar NFTs"
            className="h-9 w-44 rounded-md border border-input bg-surface-card px-3 text-sm placeholder:text-brand-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none lg:w-56"
          />
        </>
      )}
      {!isOpen && (
        <button
          type="button"
          onClick={openSearch}
          aria-label="Buscar NFTs"
          className="grid size-9 place-items-center rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <img src={searchIcon} alt="" width={20} height={20} />
        </button>
      )}
    </div>
  )
}

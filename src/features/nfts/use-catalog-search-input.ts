import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'

const SEARCH_DEBOUNCE_MS = 350

// Usable from any route: typing always targets the catalog on the home page.
export function useCatalogSearchInput() {
  const navigate = useNavigate()
  const urlSearch = useSearch({ strict: false, select: (search) => search.search })
  const [value, setValue] = useState(urlSearch ?? '')
  const [syncedUrlSearch, setSyncedUrlSearch] = useState(urlSearch)

  if (urlSearch !== syncedUrlSearch) {
    setSyncedUrlSearch(urlSearch)
    setValue(urlSearch ?? '')
  }

  const commitSearch = useDebouncedCallback((nextValue: string) => {
    void navigate({
      to: '/',
      search: (previous) => ({ ...previous, search: nextValue.trim() || undefined, page: undefined }),
      // The first keystroke creates a history entry; refinements replace it.
      replace: Boolean(urlSearch),
      resetScroll: false,
    })
  }, SEARCH_DEBOUNCE_MS)

  function changeValue(nextValue: string) {
    setValue(nextValue)
    commitSearch(nextValue)
  }

  return { value, changeValue }
}

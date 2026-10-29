import type { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import { parseSearch, stringifySearch } from '@/lib/search-params/search-serialization'

export type RouterContext = {
  queryClient: QueryClient
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    parseSearch,
    stringifySearch,
    defaultPreload: 'intent',
    // Loaders hand data to TanStack Query, which owns freshness.
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}

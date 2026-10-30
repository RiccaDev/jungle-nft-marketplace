import { queryOptions } from '@tanstack/react-query'
import { privateQueryKeys } from '@/features/auth/auth.api'
import { apiClient } from '@/lib/http/api-client'
import type { AddFavoriteRequest, FavoritesResponse } from './favorites.contracts'

export function favoritesQueryKey(userId: string) {
  return [...privateQueryKeys.user(userId), 'favorites'] as const
}

export async function getFavorites(signal?: AbortSignal) {
  const { data } = await apiClient.get<FavoritesResponse>('/me/favorites', { signal })
  return data.items
}

export async function addFavorite(nftId: string) {
  const request: AddFavoriteRequest = { nftId }
  const { data } = await apiClient.post<FavoritesResponse>('/me/favorites', request)
  return data.items
}

export async function removeFavorite(nftId: string) {
  const { data } = await apiClient.delete<FavoritesResponse>(`/me/favorites/${encodeURIComponent(nftId)}`)
  return data.items
}

export const favoritesQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: favoritesQueryKey(userId),
    queryFn: ({ signal }) => getFavorites(signal),
  })

import { loadMockState, saveMockState } from './mock-storage'

type StoredFavorite = {
  nftId: string
  addedAt: string
}

// Favorites per user, persisted so they survive a refresh; most recent first.
const FAVORITES_STORAGE_NAME = 'favorites:v1'
const favoritesByUser = loadMockState<Record<string, StoredFavorite[]>>(FAVORITES_STORAGE_NAME, () => ({}))

export function listUserFavorites(userId: string): readonly StoredFavorite[] {
  return favoritesByUser[userId] ?? []
}

// Idempotent: favoriting twice keeps a single entry.
export function addUserFavorite(userId: string, nftId: string) {
  const favorites = listUserFavorites(userId)
  if (favorites.some((favorite) => favorite.nftId === nftId)) return
  favoritesByUser[userId] = [{ nftId, addedAt: new Date().toISOString() }, ...favorites]
  saveMockState(FAVORITES_STORAGE_NAME, favoritesByUser)
}

export function removeUserFavorite(userId: string, nftId: string) {
  favoritesByUser[userId] = listUserFavorites(userId).filter((favorite) => favorite.nftId !== nftId)
  saveMockState(FAVORITES_STORAGE_NAME, favoritesByUser)
}

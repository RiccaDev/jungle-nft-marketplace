import { http, HttpResponse } from 'msw'
import type { AddFavoriteRequest, FavoritesResponse } from '@/features/favorites/favorites.contracts'
import type { NftSummary } from '@/features/nfts/nft.contracts'
import type { ApiErrorBody } from '@/lib/http/api-error'
import { apiUrl } from '@/lib/http/config'
import { resolveRequestSession } from '../auth/request-session'
import { toNftSummary } from '../catalog/query-nft-catalog'
import { applyNetworkConditions } from '../network/network-conditions'
import { addUserFavorite, listUserFavorites, removeUserFavorite } from '../state/favorite.state'
import { findNftRecord } from '../state/nft-catalog.state'

function favoritesResponse(userId: string) {
  // Summaries are resolved from the live catalog, so prices and stock match REST and events.
  const items = listUserFavorites(userId)
    .map((favorite) => findNftRecord(favorite.nftId))
    .filter((record) => record !== undefined)
    .map((record): NftSummary => toNftSummary(record))
  return HttpResponse.json<FavoritesResponse>({ items })
}

async function prepareFavoritesRequest(request: Request) {
  const simulatedResponse = await applyNetworkConditions(request)
  if (simulatedResponse) return simulatedResponse
  return resolveRequestSession(request)
}

export const favoriteHandlers = [
  http.get(apiUrl('/me/favorites'), async ({ request }) => {
    const resolution = await prepareFavoritesRequest(request)
    if (resolution instanceof Response) return resolution
    return favoritesResponse(resolution.user.id)
  }),

  http.post(apiUrl('/me/favorites'), async ({ request }) => {
    const resolution = await prepareFavoritesRequest(request)
    if (resolution instanceof Response) return resolution

    const body = (await request.json().catch(() => ({}))) as Partial<AddFavoriteRequest>
    if (!body.nftId || !findNftRecord(body.nftId)) {
      return HttpResponse.json<ApiErrorBody>(
        { error: { code: 'NFT_NOT_FOUND', message: 'NFT não encontrado.' } },
        { status: 404 },
      )
    }
    addUserFavorite(resolution.user.id, body.nftId)
    return favoritesResponse(resolution.user.id)
  }),

  http.delete<{ nftId: string }>(apiUrl('/me/favorites/:nftId'), async ({ request, params }) => {
    const resolution = await prepareFavoritesRequest(request)
    if (resolution instanceof Response) return resolution
    removeUserFavorite(resolution.user.id, params.nftId)
    return favoritesResponse(resolution.user.id)
  }),
]

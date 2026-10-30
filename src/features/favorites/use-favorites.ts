import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isCurrentSessionUser } from '@/features/auth/session-cache'
import { useRequireAuthentication, useSession } from '@/features/auth/use-auth'
import type { NftSummary } from '@/features/nfts/nft.contracts'
import { readApiError } from '@/lib/http/api-error'
import { addFavorite, favoritesQueryKey, favoritesQueryOptions, removeFavorite } from './favorites.api'

const GENERIC_FAVORITE_ERROR = 'Não foi possível atualizar seus favoritos. Tente novamente.'

type ToggleFavoriteVariables = {
  nft: NftSummary
  shouldFavorite: boolean
  userId: string
}

export function useFavorites() {
  const { user } = useSession()
  const userId = user?.id ?? null
  const favorites = useQuery({ ...favoritesQueryOptions(userId ?? ''), enabled: userId !== null })
  return { userId, favorites, favoriteIds: new Set(favorites.data?.map((nft) => nft.id)) }
}

// Optimistic: the heart flips immediately and rolls back if the API rejects the change.
// Visitors are sent to the login screen and brought back to the current page.
export function useToggleFavorite(nft: NftSummary) {
  const queryClient = useQueryClient()
  const { userId, favorites, favoriteIds } = useFavorites()
  const { redirectToLogin } = useRequireAuthentication()

  const mutation = useMutation({
    mutationFn: ({ nft: target, shouldFavorite }: ToggleFavoriteVariables) =>
      shouldFavorite ? addFavorite(target.id) : removeFavorite(target.id),
    onMutate: async ({ nft: target, shouldFavorite, userId: ownerId }) => {
      const queryKey = favoritesQueryKey(ownerId)
      await queryClient.cancelQueries({ queryKey })
      const previousFavorites = queryClient.getQueryData<NftSummary[]>(queryKey)
      queryClient.setQueryData<NftSummary[]>(queryKey, (items = []) => {
        const withoutTarget = items.filter((item) => item.id !== target.id)
        return shouldFavorite ? [target, ...withoutTarget] : withoutTarget
      })
      return { previousFavorites }
    },
    onError: (_error, { userId: ownerId }, context) => {
      if (!isCurrentSessionUser(queryClient, ownerId)) return
      queryClient.setQueryData(favoritesQueryKey(ownerId), context?.previousFavorites)
    },
    onSuccess: (items, { userId: ownerId }) => {
      if (isCurrentSessionUser(queryClient, ownerId)) queryClient.setQueryData(favoritesQueryKey(ownerId), items)
    },
  })

  const isFavorite = favoriteIds.has(nft.id)

  function toggle() {
    if (!userId) {
      void redirectToLogin()
      return
    }
    mutation.mutate({ nft, shouldFavorite: !isFavorite, userId })
  }

  return {
    isFavorite,
    toggle,
    isBusy: mutation.isPending || (userId !== null && favorites.isPending),
    errorMessage: mutation.error ? (readApiError(mutation.error)?.message ?? GENERIC_FAVORITE_ERROR) : null,
  }
}

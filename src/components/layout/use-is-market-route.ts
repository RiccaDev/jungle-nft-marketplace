import { useLocation } from '@tanstack/react-router'

// Detail, cart and checkout screens belong to the "Mercado" flow in the design.
export function useIsMarketRoute() {
  return useLocation({ select: (location) => location.pathname.startsWith('/nfts/') })
}

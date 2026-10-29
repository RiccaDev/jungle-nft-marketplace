import { useLocation } from '@tanstack/react-router'

const AUTH_PATHS = ['/entrar', '/cadastro']

// Detail, cart and checkout screens belong to the "Mercado" flow in the design.
export function useIsMarketRoute() {
  return useLocation({
    select: (location) => location.pathname.startsWith('/nfts/') || location.pathname === '/carrinho',
  })
}

// Mobile login and sign-up are full screens without the bottom tab bar.
export function useIsAuthRoute() {
  return useLocation({ select: (location) => AUTH_PATHS.includes(location.pathname) })
}

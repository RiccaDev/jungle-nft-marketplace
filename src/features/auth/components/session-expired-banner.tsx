import { Link, useLocation } from '@tanstack/react-router'

type SessionExpiredBannerProps = {
  onDismiss: () => void
}

// Shown on public pages; private pages redirect straight to the login screen instead.
export function SessionExpiredBanner({ onDismiss }: SessionExpiredBannerProps) {
  const currentHref = useLocation({ select: (location) => location.href })

  return (
    <div role="status" className="page-container mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/60 bg-surface-card px-4 py-3 text-sm">
        <p>Sua sessão expirou. Entre novamente para acessar sua conta.</p>
        <div className="flex items-center gap-3">
          <Link
            to="/entrar"
            search={{ redirect: currentHref, reason: 'session-expired' }}
            onClick={onDismiss}
            className="font-bold text-text-accent hover:underline"
          >
            Entrar
          </Link>
          <button type="button" onClick={onDismiss} className="text-text-secondary hover:text-foreground">
            Dispensar
          </button>
        </div>
      </div>
    </div>
  )
}

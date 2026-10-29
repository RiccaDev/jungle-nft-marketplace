import { Link, useLocation } from '@tanstack/react-router'
import { NoticeBanner } from '@/components/notice-banner'

// Shown on public pages; private pages redirect straight to the login screen instead.
export function SessionExpiredBanner({ onDismiss }: { onDismiss: () => void }) {
  const currentHref = useLocation({ select: (location) => location.href })

  return (
    <NoticeBanner
      onDismiss={onDismiss}
      action={
        <Link
          to="/entrar"
          search={{ redirect: currentHref, reason: 'session-expired' }}
          onClick={onDismiss}
          className="font-bold text-text-accent hover:underline"
        >
          Entrar
        </Link>
      }
    >
      Sua sessão expirou. Entre novamente para acessar sua conta.
    </NoticeBanner>
  )
}

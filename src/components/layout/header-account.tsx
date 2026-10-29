import { Link, useLocation } from '@tanstack/react-router'
import logoutIcon from '@/assets/figma/header/logout.svg'
import { useLogout, useSession } from '@/features/auth/use-auth'

const PRIMARY_BUTTON_CLASS =
  'flex h-[35px] items-center justify-center gap-1 rounded-md bg-primary px-3 text-base font-medium text-ink hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none'

export function HeaderAccount() {
  const { status, user } = useSession()
  const logoutMutation = useLogout()
  const currentHref = useLocation({ select: (location) => location.href })

  if (status === 'loading') {
    return <span aria-hidden="true" className="h-[35px] w-[100px]" />
  }

  if (status === 'anonymous' || !user) {
    return (
      <Link to="/entrar" search={{ redirect: currentHref }} className={`${PRIMARY_BUTTON_CLASS} w-[100px]`}>
        <img src={logoutIcon} alt="" width={20} height={20} />
        Entrar
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/perfil"
        className="max-w-36 truncate text-base hover:text-text-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        aria-label={`Perfil de ${user.displayName}`}
      >
        {user.displayName}
      </Link>
      <button
        type="button"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        className={PRIMARY_BUTTON_CLASS}
      >
        <img src={logoutIcon} alt="" width={20} height={20} />
        Sair
      </button>
    </div>
  )
}

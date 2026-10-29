import { Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import closeIcon from '@/assets/figma/auth/close.svg'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { HomeHero } from '@/features/home/home-hero'
import { DESKTOP_MEDIA_QUERY, useMediaQuery } from '@/hooks/use-media-query'
import type { AuthSearch } from '../auth-search'
import { LoginForm } from './login-form'
import { RegisterForm } from './register-form'
import { SocialSignIn } from './social-sign-in'

export type AuthMode = 'login' | 'register'

type AuthScreenProps = {
  mode: AuthMode
  search: AuthSearch
}

const DIALOG_DESCRIPTIONS: Record<AuthMode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  register: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}

function SessionExpiredMessage({ search }: { search: AuthSearch }) {
  if (search.reason !== 'session-expired') return null
  return (
    <p role="status" className="rounded-[5px] border border-primary/60 px-4 py-3 text-center text-sm text-text-accent">
      Sua sessão expirou. Entre novamente para continuar de onde parou.
    </p>
  )
}

function AuthForm({ mode, search, variant }: AuthScreenProps & { variant: 'dialog' | 'page' }) {
  return mode === 'login' ? (
    <LoginForm variant={variant} redirectTo={search.redirect} />
  ) : (
    <RegisterForm variant={variant} redirectTo={search.redirect} />
  )
}

function AuthModeSwitch({ mode, search }: AuthScreenProps) {
  const linkClass = 'text-xl leading-4 font-medium aria-[current=page]:text-text-accent'

  return (
    <nav aria-label="Acesso à conta" className="flex items-stretch gap-2">
      <Link to="/entrar" search={search} replace aria-current={mode === 'login' ? 'page' : undefined} className={linkClass}>
        Entrar
      </Link>
      <span aria-hidden="true" className="w-px bg-text-coral" />
      <Link to="/cadastro" search={search} replace aria-current={mode === 'register' ? 'page' : undefined} className={linkClass}>
        Criar conta
      </Link>
    </nav>
  )
}

function AuthDialog({ mode, search }: AuthScreenProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* The Figma places the modal over the marketplace page; the hero stands in as backdrop. */}
      <div inert aria-hidden="true">
        <HomeHero />
      </div>
      <Dialog open onOpenChange={(isOpen) => !isOpen && void navigate({ href: search.redirect ?? '/' })}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100svh-2rem)] w-[500px] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-lg border-0 bg-surface-card p-0 pb-[58px] sm:max-w-[500px]"
        >
          <div className="flex flex-col items-center gap-10 px-12 pt-12">
            <DialogTitle className="sr-only">{mode === 'login' ? 'Entrar' : 'Criar conta'}</DialogTitle>
            <AuthModeSwitch mode={mode} search={search} />
            <DialogDescription className="text-center text-[13px] leading-4 text-foreground">
              {DIALOG_DESCRIPTIONS[mode]}
            </DialogDescription>
          </div>
          <div className={cn('px-20', search.reason ? 'pt-6' : 'pt-0')}>
            <SessionExpiredMessage search={search} />
          </div>
          <AuthForm mode={mode} search={search} variant="dialog" />
          <div className="pt-6">
            <SocialSignIn variant="dialog" />
          </div>
          <DialogClose
            aria-label="Fechar"
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <img src={closeIcon} alt="" width={18} height={18} />
          </DialogClose>
          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2.5 bg-primary" />
        </DialogContent>
      </Dialog>
    </>
  )
}

function AuthPage({ mode, search }: AuthScreenProps) {
  const otherMode =
    mode === 'login'
      ? { to: '/cadastro' as const, text: 'Novo na Kurio? Crie uma conta' }
      : { to: '/entrar' as const, text: 'Já tem uma conta? Entre' }

  return (
    <div className="flex flex-col gap-10 px-7 pt-20 pb-6">
      <p className="flex h-[136px] items-center justify-center text-[32px] font-bold tracking-[0.1em]">
        KURIO
      </p>
      <h1 className="text-center text-xl leading-4 font-bold">
        {mode === 'login' ? 'Entrar' : 'Criar perfil de colecionador'}
      </h1>
      <SessionExpiredMessage search={search} />
      <AuthForm mode={mode} search={search} variant="page" />
      <SocialSignIn variant="page" />
      <Link to={otherMode.to} search={search} replace className="text-center text-[15px] text-text-secondary hover:text-text-accent">
        {otherMode.text}
      </Link>
    </div>
  )
}

export function AuthScreen(props: AuthScreenProps) {
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  return isDesktop ? <AuthDialog {...props} /> : <AuthPage {...props} />
}

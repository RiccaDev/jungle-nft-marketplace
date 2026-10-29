import { useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { validateLogin } from '../auth-validation'
import { useLogin } from '../use-auth'
import { useAuthForm } from '../use-auth-form'
import { AuthFormError, AuthSubmitButton } from './auth-submit-button'
import { AuthTextField, type AuthFormVariant } from './auth-text-field'

type LoginFormProps = {
  variant: AuthFormVariant
  redirectTo: string | undefined
}

export function LoginForm({ variant, redirectTo }: LoginFormProps) {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const form = useAuthForm({
    initialValues: { email: '', password: '' },
    validate: validateLogin,
    onSubmit: async (values) => {
      await loginMutation.mutateAsync(values)
      await navigate({ href: redirectTo ?? '/' })
    },
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      aria-label="Entrar"
      className={cn('flex flex-col', variant === 'dialog' ? 'gap-6 px-20 pt-6' : 'gap-10')}
    >
      <div className="flex flex-col gap-3">
        <AuthTextField
          id="login-email"
          label="E-mail"
          type="email"
          autoComplete="email"
          variant={variant}
          value={form.values.email}
          onChange={(value) => form.setFieldValue('email', value)}
          error={form.fieldErrors.email}
          inputRef={form.registerInput('email')}
        />
        <AuthTextField
          id="login-password"
          label="Senha"
          type="password"
          autoComplete="current-password"
          variant={variant}
          value={form.values.password}
          onChange={(value) => form.setFieldValue('password', value)}
          error={form.fieldErrors.password}
          inputRef={form.registerInput('password')}
        />
        <p className="flex justify-end">
          <span aria-disabled="true" title="Disponível em breve" className="text-sm leading-4 text-text-accent">
            Esqueceu a senha?
            <span className="sr-only"> (disponível em breve)</span>
          </span>
        </p>
        <AuthFormError message={form.formError} />
      </div>
      <AuthSubmitButton
        variant={variant}
        isPending={loginMutation.isPending}
        label="Entrar"
        pendingLabel="Entrando…"
      />
    </form>
  )
}

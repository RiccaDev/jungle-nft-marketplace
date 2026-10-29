import { useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { validateRegistrationForm } from '../auth-validation'
import { useRegister } from '../use-auth'
import { useAuthForm } from '../use-auth-form'
import { AuthFormError, AuthSubmitButton } from './auth-submit-button'
import { AuthTextField, type AuthFormVariant } from './auth-text-field'

type RegisterFormProps = {
  variant: AuthFormVariant
  redirectTo: string | undefined
}

export function RegisterForm({ variant, redirectTo }: RegisterFormProps) {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const form = useAuthForm({
    initialValues: { username: '', email: '', password: '', passwordConfirmation: '' },
    validate: validateRegistrationForm,
    onSubmit: async ({ username, email, password }) => {
      await registerMutation.mutateAsync({ username, email, password })
      await navigate({ href: redirectTo ?? '/' })
    },
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void form.handleSubmit(event)}
      aria-label="Criar conta"
      className={cn('flex flex-col', variant === 'dialog' ? 'gap-6 px-20 pt-6' : 'gap-10')}
    >
      <div className="flex flex-col gap-3">
        <AuthTextField
          id="register-username"
          label="Nome de usuário"
          type="text"
          autoComplete="username"
          variant={variant}
          value={form.values.username}
          onChange={(value) => form.setFieldValue('username', value)}
          error={form.fieldErrors.username}
          inputRef={form.registerInput('username')}
        />
        <AuthTextField
          id="register-email"
          label="Digite seu e-mail"
          type="email"
          autoComplete="email"
          variant={variant}
          value={form.values.email}
          onChange={(value) => form.setFieldValue('email', value)}
          error={form.fieldErrors.email}
          inputRef={form.registerInput('email')}
        />
        <AuthTextField
          id="register-password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          variant={variant}
          value={form.values.password}
          onChange={(value) => form.setFieldValue('password', value)}
          error={form.fieldErrors.password}
          inputRef={form.registerInput('password')}
        />
        <AuthTextField
          id="register-password-confirmation"
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          variant={variant}
          value={form.values.passwordConfirmation}
          onChange={(value) => form.setFieldValue('passwordConfirmation', value)}
          error={form.fieldErrors.passwordConfirmation}
          inputRef={form.registerInput('passwordConfirmation')}
        />
        <AuthFormError message={form.formError} />
      </div>
      <AuthSubmitButton
        variant={variant}
        isPending={registerMutation.isPending}
        label={variant === 'dialog' ? 'Criar conta' : 'Criar perfil'}
        pendingLabel="Criando conta…"
      />
    </form>
  )
}

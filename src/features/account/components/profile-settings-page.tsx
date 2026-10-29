import { useQuery } from '@tanstack/react-query'
import { useId, useState, type ChangeEvent, type ReactNode } from 'react'
import { TextField } from '@/components/text-field'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { accountQueryOptions } from '@/features/auth/auth.api'
import type { AccountResponse } from '@/features/auth/auth.contracts'
import { useAuthForm } from '@/features/auth/use-auth-form'
import { readApiError } from '@/lib/http/api-error'
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES, type ChangePasswordFormValues } from '../account.contracts'
import { validateAvatarFile, validatePasswordChangeForm, validateProfile } from '../account-validation'
import { useChangePassword, useRemoveAvatar, useUpdateAvatar, useUpdateProfile } from '../use-account-mutations'
import { AccountAvatar } from './account-avatar'

function SettingsSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5">
      <h2 id={id} className="border-b border-primary/40 pb-3 text-[17px] leading-4 font-bold text-text-accent">
        {title}
      </h2>
      {children}
    </section>
  )
}

function FormFeedback({ success, error }: { success: string | null; error: string | null }) {
  return (
    <>
      <p role="status" className="text-sm text-text-accent empty:hidden">
        {success}
      </p>
      <p role="alert" className="text-sm text-text-coral empty:hidden">
        {error}
      </p>
    </>
  )
}

function ProfileDetailsForm({ userId, account }: { userId: string; account: AccountResponse }) {
  const updateProfile = useUpdateProfile(userId)
  const [success, setSuccess] = useState<string | null>(null)
  const form = useAuthForm({
    initialValues: { displayName: account.displayName, username: account.username, email: account.email },
    validate: validateProfile,
    onSubmit: async (values) => {
      setSuccess(null)
      await updateProfile.mutateAsync(values)
      setSuccess('Perfil atualizado.')
    },
  })

  return (
    <SettingsSection id="profile-details-title" title="Dados do perfil">
      <form onSubmit={(event) => void form.handleSubmit(event)} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id="profile-display-name"
            label="Nome de exibição"
            type="text"
            value={form.values.displayName}
            onChange={(value) => form.setFieldValue('displayName', value)}
            autoComplete="name"
            error={form.fieldErrors.displayName}
            inputRef={form.registerInput('displayName')}
          />
          <TextField
            id="profile-username"
            label="Nome de usuário"
            type="text"
            value={form.values.username}
            onChange={(value) => form.setFieldValue('username', value)}
            autoComplete="username"
            error={form.fieldErrors.username}
            inputRef={form.registerInput('username')}
          />
          <TextField
            id="profile-email"
            label="E-mail"
            type="email"
            value={form.values.email}
            onChange={(value) => form.setFieldValue('email', value)}
            autoComplete="email"
            error={form.fieldErrors.email}
            inputRef={form.registerInput('email')}
          />
        </div>
        <FormFeedback success={success} error={form.formError} />
        <Button type="submit" disabled={updateProfile.isPending} className="self-start font-bold text-ink">
          {updateProfile.isPending ? 'Salvando…' : 'Salvar perfil'}
        </Button>
      </form>
    </SettingsSection>
  )
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo.'))
    reader.readAsDataURL(file)
  })
}

function AvatarEditor({ userId, account }: { userId: string; account: AccountResponse }) {
  const inputId = useId()
  const hintId = useId()
  const updateAvatar = useUpdateAvatar(userId)
  const removeAvatar = useRemoveAvatar(userId)
  // The preview is the chosen file itself; the saved avatar only changes with the API answer.
  const [preview, setPreview] = useState<{ dataUrl: string; fileName: string } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const apiError = updateAvatar.error ?? removeAvatar.error
  const error = fileError ?? (apiError ? (readApiError(apiError)?.message ?? 'Não foi possível salvar o avatar.') : null)
  const isBusy = updateAvatar.isPending || removeAvatar.isPending

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setSuccess(null)
    updateAvatar.reset()
    removeAvatar.reset()
    if (!file) return

    const validationError = validateAvatarFile(file)
    setFileError(validationError ?? null)
    if (validationError) {
      setPreview(null)
      return
    }
    try {
      setPreview({ dataUrl: await readFileAsDataUrl(file), fileName: file.name })
    } catch {
      setFileError('Não foi possível ler o arquivo.')
    }
  }

  function handleSave() {
    if (!preview) return
    updateAvatar.mutate(
      { dataUrl: preview.dataUrl },
      {
        onSuccess: () => {
          setPreview(null)
          setSuccess('Avatar atualizado.')
        },
      },
    )
  }

  return (
    <SettingsSection id="profile-avatar-title" title="Avatar">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <AccountAvatar
            displayName={account.displayName}
            src={preview?.dataUrl ?? account.avatarUrl}
            size={96}
            alt={preview ? 'Pré-visualização do novo avatar' : undefined}
          />
          {preview && <span className="text-xs text-text-secondary">Pré-visualização</span>}
        </div>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <input
              id={inputId}
              type="file"
              accept={AVATAR_MIME_TYPES.join(',')}
              onChange={(event) => void handleFileChange(event)}
              aria-describedby={hintId}
              disabled={isBusy}
              className="peer sr-only"
            />
            <label
              htmlFor={inputId}
              className="inline-flex h-9 cursor-pointer items-center rounded-md border border-border px-4 text-sm font-bold hover:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
            >
              Escolher imagem
            </label>
            {preview ? (
              <>
                <Button type="button" onClick={handleSave} disabled={isBusy} className="font-bold text-ink">
                  {updateAvatar.isPending ? 'Salvando…' : 'Salvar avatar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setPreview(null)} disabled={isBusy}>
                  Cancelar
                </Button>
              </>
            ) : (
              account.avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => removeAvatar.mutate(undefined, { onSuccess: () => setSuccess('Avatar removido.') })}
                >
                  {removeAvatar.isPending ? 'Removendo…' : 'Remover avatar'}
                </Button>
              )
            )}
          </div>
          <p id={hintId} className="text-xs text-text-secondary">
            PNG, JPEG ou WebP de até {AVATAR_MAX_BYTES / 1024} KB.
            {preview && <> Arquivo selecionado: {preview.fileName}.</>}
          </p>
          <FormFeedback success={success} error={error} />
        </div>
      </div>
    </SettingsSection>
  )
}

const EMPTY_PASSWORD_FORM: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
}

function PasswordForm({ onChanged }: { onChanged: () => void }) {
  const changePassword = useChangePassword()
  const form = useAuthForm({
    initialValues: EMPTY_PASSWORD_FORM,
    validate: validatePasswordChangeForm,
    onSubmit: async ({ currentPassword, newPassword }) => {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      onChanged()
    },
  })

  return (
    <form onSubmit={(event) => void form.handleSubmit(event)} noValidate className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <TextField
          id="password-current"
          label="Senha atual"
          type="password"
          value={form.values.currentPassword}
          onChange={(value) => form.setFieldValue('currentPassword', value)}
          autoComplete="current-password"
          error={form.fieldErrors.currentPassword}
          inputRef={form.registerInput('currentPassword')}
        />
        <TextField
          id="password-new"
          label="Nova senha"
          type="password"
          value={form.values.newPassword}
          onChange={(value) => form.setFieldValue('newPassword', value)}
          autoComplete="new-password"
          error={form.fieldErrors.newPassword}
          inputRef={form.registerInput('newPassword')}
        />
        <TextField
          id="password-confirmation"
          label="Confirmar nova senha"
          type="password"
          value={form.values.newPasswordConfirmation}
          onChange={(value) => form.setFieldValue('newPasswordConfirmation', value)}
          autoComplete="new-password"
          error={form.fieldErrors.newPasswordConfirmation}
          inputRef={form.registerInput('newPasswordConfirmation')}
        />
      </div>
      <FormFeedback success={null} error={form.formError} />
      <Button type="submit" disabled={changePassword.isPending} className="self-start font-bold text-ink">
        {changePassword.isPending ? 'Alterando…' : 'Alterar senha'}
      </Button>
    </form>
  )
}

function PasswordSection() {
  // Remounting the form after a change clears the typed passwords.
  const [formKey, setFormKey] = useState(0)
  const [success, setSuccess] = useState<string | null>(null)

  return (
    <SettingsSection id="profile-password-title" title="Senha">
      <p className="text-sm text-text-secondary">
        Ao alterar a senha, as sessões abertas em outros dispositivos são encerradas.
      </p>
      <PasswordForm
        key={formKey}
        onChanged={() => {
          setFormKey((key) => key + 1)
          setSuccess('Senha alterada.')
        }}
      />
      <FormFeedback success={success} error={null} />
    </SettingsSection>
  )
}

export function ProfileSettingsPage({ userId }: { userId: string }) {
  const account = useQuery(accountQueryOptions(userId))

  if (account.isPending) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    )
  }
  // The summary above already offers a retry for the account.
  if (account.isError) return null

  return (
    <div className="flex max-w-4xl flex-col gap-12">
      <ProfileDetailsForm userId={userId} account={account.data} />
      <AvatarEditor userId={userId} account={account.data} />
      <PasswordSection />
    </div>
  )
}

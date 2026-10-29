import { cn } from 'cn'
import { EyeIcon } from 'lucide-react'
import { useState, type Ref } from 'react'
import passwordHiddenIcon from '@/assets/figma/auth/password-hidden.svg'
import mobilePasswordHiddenIcon from '@/assets/figma/auth/mobile-password-hidden.svg'

export type AuthFormVariant = 'dialog' | 'page'

type AuthTextFieldProps = {
  id: string
  label: string
  type: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  autoComplete: string
  error?: string
  variant: AuthFormVariant
  inputRef?: Ref<HTMLInputElement>
}

const FIELD_SIZE_CLASS: Record<AuthFormVariant, string> = {
  dialog: 'h-10 rounded-[5px]',
  page: 'h-[50px] rounded-[10px]',
}

export function AuthTextField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  error,
  variant,
  inputRef,
}: AuthTextFieldProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const isPassword = type === 'password'
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={cn(
          'flex items-center border px-4 focus-within:border-primary',
          FIELD_SIZE_CLASS[variant],
          error ? 'border-text-coral' : 'border-border',
        )}
      >
        <input
          ref={inputRef}
          id={id}
          name={id}
          type={isPassword && isPasswordVisible ? 'text' : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent text-sm leading-4 placeholder:text-brand-secondary focus:outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-controls={id}
            className="ml-2 grid size-6 shrink-0 place-items-center rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {isPasswordVisible ? (
              <EyeIcon aria-hidden="true" className="size-[18px] text-brand-secondary" />
            ) : (
              <img
                src={variant === 'dialog' ? passwordHiddenIcon : mobilePasswordHiddenIcon}
                alt=""
                width={variant === 'dialog' ? 19 : 15}
                height={variant === 'dialog' ? 15 : 13}
              />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-[13px] leading-4 text-text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

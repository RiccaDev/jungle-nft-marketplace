import { cn } from 'cn'
import type { Ref } from 'react'

type TextFieldProps = {
  id: string
  label: string
  type: 'text' | 'email' | 'password'
  value: string
  onChange: (value: string) => void
  autoComplete: string
  error?: string
  disabled?: boolean
  inputRef?: Ref<HTMLInputElement>
}

// Form field with a visible label and its error associated through aria-describedby.
export function TextField({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  error,
  disabled,
  inputRef,
}: TextFieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] leading-4 font-bold">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'h-10 rounded-[5px] border bg-transparent px-3 text-sm leading-4 focus:border-primary focus:outline-none disabled:opacity-60 max-md:h-[50px] max-md:rounded-[10px]',
          error ? 'border-text-coral' : 'border-border',
        )}
      />
      {error && (
        <p id={errorId} className="text-[13px] leading-4 text-text-coral">
          {error}
        </p>
      )}
    </div>
  )
}

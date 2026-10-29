import { cn } from 'cn'
import type { AuthFormVariant } from './auth-text-field'

type AuthSubmitButtonProps = {
  variant: AuthFormVariant
  isPending: boolean
  label: string
  pendingLabel: string
}

export function AuthSubmitButton({ variant, isPending, label, pendingLabel }: AuthSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      className={cn(
        'w-full bg-primary text-base leading-4 font-bold text-ink hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        variant === 'dialog' ? 'h-[45px] rounded-[5px]' : 'h-[60px] rounded-[10px]',
      )}
    >
      {isPending ? pendingLabel : label}
    </button>
  )
}

export function AuthFormError({ message }: { message: string | null }) {
  return (
    <p role="alert" className="text-sm text-text-coral empty:hidden">
      {message}
    </p>
  )
}

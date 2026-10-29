import { cn } from 'cn'
import type { ReactNode } from 'react'

type UnavailableActionButtonProps = {
  reasonId: string
  className: string
  children: ReactNode
  label?: string
}

// Rendered while the underlying flow does not exist: focusable and described, but inert.
export function UnavailableActionButton({ reasonId, className, children, label }: UnavailableActionButtonProps) {
  return (
    <button
      type="button"
      aria-disabled="true"
      aria-describedby={reasonId}
      aria-label={label}
      onClick={(event) => event.preventDefault()}
      className={cn('cursor-not-allowed opacity-60', className)}
    >
      {children}
    </button>
  )
}

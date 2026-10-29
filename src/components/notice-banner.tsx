import type { ReactNode } from 'react'

type NoticeBannerProps = {
  children: ReactNode
  action?: ReactNode
  onDismiss: () => void
}

export function NoticeBanner({ children, action, onDismiss }: NoticeBannerProps) {
  return (
    <div role="status" className="page-container mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/60 bg-surface-card px-4 py-3 text-sm">
        <p className="min-w-0 flex-1">{children}</p>
        <div className="flex items-center gap-3">
          {action}
          <button type="button" onClick={onDismiss} className="text-text-secondary hover:text-foreground">
            Dispensar
          </button>
        </div>
      </div>
    </div>
  )
}

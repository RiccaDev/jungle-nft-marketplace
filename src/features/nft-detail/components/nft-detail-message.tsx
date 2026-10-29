import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'

type NftDetailMessageProps = {
  title: string
  description: string
  action?: ReactNode
}

export function NftDetailMessage({ title, description, action }: NftDetailMessageProps) {
  return (
    <div className="page-container flex min-h-[50vh] flex-col items-start justify-center gap-4 py-16">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      <div className="flex flex-wrap gap-3">
        {action}
        <Button asChild variant={action ? 'outline' : 'default'}>
          <Link to="/" hash="catalogo">
            Voltar ao catálogo
          </Link>
        </Button>
      </div>
    </div>
  )
}

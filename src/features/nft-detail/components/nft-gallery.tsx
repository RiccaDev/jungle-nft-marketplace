import { cn } from 'cn'
import { useState } from 'react'
import zoomIcon from '@/assets/figma/detail/zoom.svg'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { NftDetail } from '@/features/nfts/nft.contracts'
import { NftGalleryViewImage } from './nft-gallery-view-image'

type NftGalleryProps = {
  nft: NftDetail
  variant: 'desktop' | 'mobile'
}

export function NftGallery({ nft, variant }: NftGalleryProps) {
  const [selectedViewId, setSelectedViewId] = useState(nft.gallery[0]?.id)
  const selectedView = nft.gallery.find((view) => view.id === selectedViewId) ?? nft.gallery[0]
  if (!selectedView) return null

  const viewSelector = (
    <ul
      aria-label="Vistas da obra"
      className={cn(
        variant === 'desktop' ? 'flex flex-col gap-4' : 'flex items-center justify-center',
      )}
    >
      {nft.gallery.map((view) => {
        const isSelected = view.id === selectedView.id
        return (
          <li key={view.id}>
            <button
              type="button"
              aria-label={`Mostrar ${view.label.toLowerCase()}`}
              aria-pressed={isSelected}
              onClick={() => setSelectedViewId(view.id)}
              className={cn(
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                variant === 'desktop'
                  ? cn('block size-[100px] overflow-hidden rounded-lg border', isSelected ? 'border-primary' : 'border-transparent')
                  : 'grid h-6 min-w-6 place-items-center px-1',
              )}
            >
              {variant === 'desktop' ? (
                <NftGalleryViewImage image={nft.image} view={view} sizes="100px" className="size-full rounded-lg" />
              ) : (
                // The dot stays small; the button around it keeps a 24px touch target.
                <span
                  aria-hidden="true"
                  className={cn('block h-[7px] rounded-full transition-[width]', isSelected ? 'w-5 bg-primary' : 'w-[7px] bg-primary/40')}
                />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )

  const zoomDialog = (
    <Dialog>
      <DialogTrigger
        aria-label="Ampliar imagem"
        className="absolute top-[15px] right-[15px] z-10 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <img src={zoomIcon} alt="" width={30} height={30} />
      </DialogTrigger>
      <DialogContent className="max-w-[min(90vw,720px)] border-border bg-surface-card p-4 sm:max-w-[min(90vw,720px)]">
        <DialogTitle>{nft.name}</DialogTitle>
        <DialogDescription>{selectedView.label}</DialogDescription>
        <NftGalleryViewImage
          image={nft.image}
          view={selectedView}
          sizes="(min-width: 768px) 720px, 90vw"
          className="aspect-square w-full rounded-2xl"
        />
      </DialogContent>
    </Dialog>
  )

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col items-center gap-[9px]">
        <div className="relative w-full">
          <NftGalleryViewImage
            image={nft.image}
            view={selectedView}
            sizes="100vw"
            isPriority
            className="h-[356px] w-full rounded-3xl"
          />
          {zoomDialog}
        </div>
        {viewSelector}
      </div>
    )
  }

  return (
    <div className="flex h-[448px] shrink-0 items-center gap-7 self-start">
      {viewSelector}
      <div className="relative grid size-[444px] place-items-center rounded-md bg-surface-card p-4">
        <NftGalleryViewImage
          image={nft.image}
          view={selectedView}
          sizes="404px"
          isPriority
          className="size-[404px] rounded-3xl"
        />
        {zoomDialog}
      </div>
    </div>
  )
}

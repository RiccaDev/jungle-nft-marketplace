import { cn } from 'cn'
import type { NftGalleryView, NftImage } from '@/features/nfts/nft.contracts'

type NftGalleryViewImageProps = {
  image: NftImage
  view: NftGalleryView
  sizes: string
  className?: string
  isPriority?: boolean
}

export function NftGalleryViewImage({ image, view, sizes, className, isPriority = false }: NftGalleryViewImageProps) {
  return (
    <div className={cn('overflow-hidden', className)}>
      <img
        src={image.src}
        srcSet={image.srcSet}
        sizes={sizes}
        alt={view.zoom === 1 ? image.alt : `${image.alt} — ${view.label.toLowerCase()}`}
        width={480}
        height={480}
        fetchPriority={isPriority ? 'high' : undefined}
        loading={isPriority ? 'eager' : 'lazy'}
        decoding="async"
        className="size-full object-cover"
        style={{
          transform: `scale(${view.zoom})`,
          transformOrigin: `${view.focusX}% ${view.focusY}%`,
        }}
      />
    </div>
  )
}

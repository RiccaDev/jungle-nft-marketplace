import { Skeleton } from '@/components/ui/skeleton'

export function NftDetailSkeleton({ variant }: { variant: 'desktop' | 'mobile' }) {
  if (variant === 'mobile') {
    return (
      <div aria-hidden="true" data-testid="nft-detail-skeleton" className="flex flex-col">
        <div className="flex flex-col gap-2 px-7 pt-6 pb-[150px]">
          <div className="flex justify-between">
            <Skeleton className="size-[35px] rounded-full" />
            <Skeleton className="size-[35px] rounded-full" />
          </div>
          <Skeleton className="h-[356px] rounded-3xl" />
        </div>
        <div className="-mt-[114px] flex flex-col gap-4 rounded-t-[31px] bg-surface-card px-6 pt-8 pb-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-7 w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <div aria-hidden="true" data-testid="nft-detail-skeleton" className="flex flex-col gap-3 lg:flex-row lg:gap-8">
      <div className="flex shrink-0 items-center gap-7">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="size-[100px] rounded-lg" />
          ))}
        </div>
        <Skeleton className="size-[444px] rounded-md" />
      </div>
      <div className="flex flex-1 flex-col gap-6 py-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-2/3" />
      </div>
    </div>
  )
}

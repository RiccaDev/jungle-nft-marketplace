import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CatalogFiltersPanel } from './catalog-filters-panel'
import { CatalogSortSelect } from './catalog-sort-select'

// Filters live in a drawer below the desktop breakpoint; changes apply immediately.
export function CatalogFiltersSheet({ trigger }: { trigger: ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="right" className="w-[340px] overflow-y-auto border-border bg-ink p-0 sm:max-w-[340px]">
        <SheetHeader className="px-5 pt-6">
          <SheetTitle className="text-xl">Filtros</SheetTitle>
          <SheetDescription>Os resultados são atualizados a cada alteração.</SheetDescription>
        </SheetHeader>
        <div className="px-5 md:hidden">
          <CatalogSortSelect />
        </div>
        <CatalogFiltersPanel className="mx-5 mb-6" />
      </SheetContent>
    </Sheet>
  )
}

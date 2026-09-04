import React from 'react';
import {
  CatalogTopBarSkeleton,
  DesktopFilterSidebarSkeleton,
} from '@/components/filters/motorcycle-filters-skeleton';
import { MotorcycleGridSkeleton } from '@/components/motorcycles/motorcycle-grid';

export default function CatalogLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando catálogo de motos..."
      className="bg-zinc-950 min-h-screen pb-20 text-zinc-100 animate-in fade-in-50 duration-150"
    >
      {/* Sticky Top Bar Skeleton */}
      <CatalogTopBarSkeleton />

      {/* Main Content Area mirroring app/(public)/motos/page.tsx */}
      <div className="container mx-auto px-3 sm:px-6 pt-2.5 pb-8 md:py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 items-start relative">
          {/* Desktop Filter Sidebar Skeleton */}
          <DesktopFilterSidebarSkeleton />

          {/* Results Area with MotorcycleGridSkeleton */}
          <div className="md:col-span-3 space-y-6">
            <MotorcycleGridSkeleton count={6} />
          </div>
        </div>
      </div>
      <span className="sr-only">Carregando catálogo de veículos da AF Motos...</span>
    </div>
  );
}

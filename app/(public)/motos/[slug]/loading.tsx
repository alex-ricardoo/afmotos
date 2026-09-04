import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageCarouselSkeleton } from '@/components/gallery/image-carousel-skeleton';
import { MotorcycleSpecsSkeleton } from '@/components/motorcycles/motorcycle-specs-skeleton';
import { MotorcycleDetailCtaSkeleton } from '@/components/motorcycles/motorcycle-detail-cta-skeleton';
import { MotorcycleGridSkeleton } from '@/components/motorcycles/motorcycle-grid';

export default function MotorcycleDetailLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando detalhes da motocicleta..."
      className="bg-zinc-950 min-h-screen text-zinc-100 pb-20 animate-in fade-in-50 duration-150"
    >
      {/* Breadcrumb Bar Skeleton */}
      <div className="border-b border-amber-500/20 bg-[#0d0d0d]">
        <div className="container mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-12 rounded bg-zinc-800/80" />
            <span className="text-zinc-700">/</span>
            <Skeleton className="h-3.5 w-24 rounded bg-zinc-800/80" />
            <span className="text-zinc-700">/</span>
            <Skeleton className="h-3.5 w-36 rounded bg-zinc-800/90" />
          </div>
          <Skeleton className="hidden sm:block h-3.5 w-28 rounded bg-zinc-800/70" />
        </div>
      </div>

      {/* Main Vehicle Showcase */}
      <div className="container mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column (8 cols): Gallery + Mobile Info + Specs */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* Gallery Frame */}
            <ImageCarouselSkeleton />

            {/* Mobile Title & Price (lg:hidden) */}
            <div className="lg:hidden space-y-3 pt-2">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3.5 w-20 rounded bg-amber-500/30" />
                <Skeleton className="h-6 w-24 rounded-full bg-zinc-800/80" />
              </div>
              <Skeleton className="h-8 w-4/5 rounded-xl bg-zinc-800/90" />
              <Skeleton className="h-4 w-32 rounded bg-zinc-800/60" />
              <Skeleton className="h-9 w-40 rounded-xl bg-amber-400/20 pt-1" />
            </div>

            {/* Technical Specifications */}
            <MotorcycleSpecsSkeleton />
          </div>

          {/* Right Column (4 cols): Sticky Summary & Lead Box */}
          <div className="lg:col-span-5 xl:col-span-4 sticky top-28 space-y-6">
            <MotorcycleDetailCtaSkeleton />
          </div>
        </div>

        {/* Similar Bikes Grid Section */}
        <div className="mt-20 pt-12 border-t border-zinc-800/80 space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-7 w-64 rounded-xl bg-zinc-800/90" />
            <Skeleton className="h-4 w-96 max-w-full rounded bg-zinc-800/60" />
          </div>
          <MotorcycleGridSkeleton count={3} />
        </div>
      </div>
      <span className="sr-only">Carregando detalhes do veículo na AF Motos...</span>
    </div>
  );
}

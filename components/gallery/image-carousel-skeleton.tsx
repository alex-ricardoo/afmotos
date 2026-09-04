import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function ImageCarouselSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando galeria de fotos..."
      className="space-y-3 select-none"
    >
      {/* Main Image Frame (4:3 aspect ratio matching ImageCarousel) */}
      <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-zinc-800/80 shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900/80">
          <Skeleton className="w-full h-full rounded-none" />
          {/* Subtle bottom shadow overlay matching real carousel */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Thumbnails Row Skeleton */}
      <div className="flex gap-2.5 overflow-hidden pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="relative w-20 sm:w-24 aspect-[4/3] shrink-0 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/70"
          >
            <Skeleton className="w-full h-full rounded-none" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando fotos da motocicleta...</span>
    </div>
  );
}

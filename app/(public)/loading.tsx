import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MotorcycleCardSkeleton } from '@/components/motorcycles/motorcycle-card-skeleton';

export default function PublicFallbackLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando página..."
      className="container mx-auto px-4 md:px-6 py-8 space-y-8 animate-in fade-in-50 duration-200"
    >
      {/* Top Banner / Breadcrumb Skeleton */}
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-4 w-32 rounded bg-zinc-800/80" />
        <Skeleton className="h-9 w-3/4 sm:w-80 rounded-xl bg-zinc-800/90" />
        <Skeleton className="h-4 w-full sm:w-96 rounded bg-zinc-800/60" />
      </div>

      {/* Grid of Skeleton Cards matching standard public view */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-full">
            <MotorcycleCardSkeleton />
          </div>
        ))}
      </div>

      {/* Subtle reassurance footer for slow 3G/4G connections */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-zinc-500 flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400/80 animate-pulse" />
          Carregando informações mais recentes do showroom AF Motos...
        </p>
      </div>

      <span className="sr-only">Carregando conteúdo da página da AF Motos...</span>
    </div>
  );
}

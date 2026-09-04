import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MotorcycleCardSkeleton } from '@/components/motorcycles/motorcycle-card-skeleton';

export default function AluguelLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando planos de aluguel..."
      className="bg-zinc-950 min-h-screen text-zinc-100 py-10 px-4 md:px-8 space-y-12 animate-in fade-in-50 duration-150 max-w-7xl mx-auto"
    >
      {/* Hero Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Skeleton className="h-4 w-32 mx-auto rounded-full bg-amber-500/20" />
        <Skeleton className="h-10 w-3/4 mx-auto rounded-xl bg-zinc-800/90" />
        <Skeleton className="h-4 w-5/6 mx-auto rounded bg-zinc-800/60" />
      </div>

      {/* Plans Comparison Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-6 space-y-5"
          >
            <Skeleton className="h-6 w-32 rounded-lg bg-zinc-800/80" />
            <Skeleton className="h-10 w-44 rounded-xl bg-amber-400/20" />
            <div className="space-y-2 pt-2 border-t border-zinc-800/60">
              <Skeleton className="h-4 w-full rounded bg-zinc-800/60" />
              <Skeleton className="h-4 w-5/6 rounded bg-zinc-800/60" />
              <Skeleton className="h-4 w-4/6 rounded bg-zinc-800/60" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-800/80 mt-4" />
          </div>
        ))}
      </div>

      {/* Fleet Grid */}
      <div className="space-y-6 pt-4">
        <Skeleton className="h-8 w-60 rounded-xl bg-zinc-800/90" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <MotorcycleCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <span className="sr-only">Carregando planos de locação da AF Motos...</span>
    </div>
  );
}

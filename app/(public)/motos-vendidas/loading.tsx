import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MotorcycleGridSkeleton } from '@/components/motorcycles/motorcycle-grid';

export default function MotosVendidasLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando motos vendidas..."
      className="bg-zinc-950 min-h-screen text-zinc-100 py-10 px-4 md:px-8 space-y-10 animate-in fade-in-50 duration-150 max-w-7xl mx-auto"
    >
      {/* Header Banner */}
      <div className="space-y-3 max-w-2xl">
        <Skeleton className="h-4 w-32 rounded-full bg-emerald-500/20" />
        <Skeleton className="h-9 sm:h-11 w-4/5 rounded-2xl bg-zinc-800/90" />
        <Skeleton className="h-4 w-full rounded bg-zinc-800/60" />
      </div>

      {/* Grid of Sold Bikes */}
      <MotorcycleGridSkeleton count={6} />
      <span className="sr-only">Carregando histórico de entregas da AF Motos...</span>
    </div>
  );
}

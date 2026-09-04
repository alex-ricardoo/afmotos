import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HistoricoVeicularLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando histórico veicular..."
      className="bg-zinc-950 min-h-screen text-zinc-100 py-12 px-4 md:px-8 space-y-12 animate-in fade-in-50 duration-150 max-w-5xl mx-auto"
    >
      {/* Hero Section Skeleton */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-5 w-48 mx-auto rounded-full bg-emerald-500/20" />
        <Skeleton className="h-10 sm:h-12 w-4/5 mx-auto rounded-xl bg-zinc-800/90" />
        <Skeleton className="h-4 w-full mx-auto rounded bg-zinc-800/60" />
      </div>

      {/* Plate Input Card Mockup */}
      <div className="max-w-xl mx-auto bg-zinc-900/60 p-6 sm:p-8 rounded-3xl border border-zinc-800/80 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-14 flex-1 rounded-2xl bg-zinc-800/80" />
          <Skeleton className="h-14 sm:w-36 rounded-2xl bg-amber-500/20" />
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
          <Skeleton className="h-3 w-28 rounded bg-zinc-800/60" />
          <Skeleton className="h-3 w-32 rounded bg-zinc-800/60" />
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 text-center space-y-2"
          >
            <Skeleton className="h-8 w-16 mx-auto rounded-lg bg-zinc-800/80" />
            <Skeleton className="h-3 w-20 mx-auto rounded bg-zinc-800/60" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando consulta veicular da AF Motos...</span>
    </div>
  );
}

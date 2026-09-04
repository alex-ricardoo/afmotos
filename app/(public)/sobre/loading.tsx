import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SobreLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando sobre a AF Motos..."
      className="bg-zinc-950 min-h-screen text-zinc-100 py-12 px-4 md:px-8 space-y-16 animate-in fade-in-50 duration-150 max-w-6xl mx-auto"
    >
      {/* Hero Section */}
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-4 w-28 rounded-full bg-amber-500/20" />
        <Skeleton className="h-10 sm:h-12 w-4/5 rounded-2xl bg-zinc-800/90" />
        <Skeleton className="h-4 w-full rounded bg-zinc-800/60" />
        <Skeleton className="h-4 w-5/6 rounded bg-zinc-800/60" />
      </div>

      {/* Differentials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-3"
          >
            <Skeleton className="w-12 h-12 rounded-2xl bg-amber-500/10" />
            <Skeleton className="h-5 w-32 rounded-lg bg-zinc-800/80" />
            <Skeleton className="h-3.5 w-full rounded bg-zinc-800/60" />
            <Skeleton className="h-3.5 w-4/5 rounded bg-zinc-800/60" />
          </div>
        ))}
      </div>

      {/* Physical Store & Location Section */}
      <div className="rounded-3xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="p-8 space-y-5">
          <Skeleton className="h-7 w-48 rounded-xl bg-zinc-800/90" />
          <Skeleton className="h-4 w-full rounded bg-zinc-800/60" />
          <Skeleton className="h-4 w-3/4 rounded bg-zinc-800/60" />
          <div className="pt-4 space-y-3">
            <Skeleton className="h-4 w-40 rounded bg-zinc-800/70" />
            <Skeleton className="h-4 w-48 rounded bg-zinc-800/70" />
          </div>
        </div>
        <div className="h-64 lg:h-auto bg-zinc-900/90">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      </div>
      <span className="sr-only">Carregando informações institucionais da AF Motos...</span>
    </div>
  );
}

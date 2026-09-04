import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function MotorcycleSpecsSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando especificações da moto..."
      className="space-y-8 select-none"
    >
      {/* 1. Differentials & Seals Box */}
      <div className="bg-[#151515] rounded-2xl p-5 sm:p-6 border border-amber-500/20 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded bg-amber-400/40" />
          <Skeleton className="h-4 w-36 rounded bg-zinc-800/80" />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 sm:w-36 rounded-xl bg-zinc-800/70" />
          ))}
        </div>
      </div>

      {/* 2. Trust Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/40 border border-emerald-500/30 flex items-center gap-3.5">
        <Skeleton className="w-10 h-10 rounded-xl bg-emerald-500/20 shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-4 w-48 rounded bg-zinc-800/80" />
          <Skeleton className="h-3 w-3/4 rounded bg-zinc-800/60" />
        </div>
      </div>

      {/* 3. Technical Specifications Grid */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded bg-amber-400/40" />
          <Skeleton className="h-4 w-44 rounded bg-zinc-800/80" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#151515] p-3.5 sm:p-4 rounded-xl border border-zinc-800/80 space-y-2"
            >
              <div className="flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded bg-zinc-800/70" />
                <Skeleton className="h-3 w-16 rounded bg-zinc-800/60" />
              </div>
              <Skeleton className="h-5 w-24 rounded bg-zinc-800/90" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Carregando especificações técnicas...</span>
    </div>
  );
}

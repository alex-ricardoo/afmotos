import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function CatalogTopBarSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando barra de filtros..."
      className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-20 z-30 shadow-xs"
    >
      <div className="container mx-auto px-3 sm:px-6 max-w-7xl py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2.5">
          {/* Title & Count Badge Skeleton */}
          <div className="flex items-center gap-2 min-w-0">
            <Skeleton className="h-5 sm:h-6 w-36 sm:w-44 rounded-lg bg-zinc-800/90" />
            <Skeleton className="h-5 w-16 rounded-full bg-amber-500/10 border border-amber-500/20" />
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile filter button skeleton */}
            <div className="md:hidden">
              <Skeleton className="h-8 w-24 rounded-xl bg-zinc-800/80" />
            </div>
            {/* Desktop controls skeleton */}
            <div className="hidden md:flex items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-xl bg-zinc-800/70" />
              <Skeleton className="h-8 w-16 rounded-xl bg-zinc-800/70" />
            </div>
          </div>
        </div>
      </div>
      <span className="sr-only">Carregando barra de controles do estoque...</span>
    </div>
  );
}

export function DesktopFilterSidebarSkeleton() {
  return (
    <aside
      role="status"
      aria-busy="true"
      aria-label="Carregando filtros laterais..."
      className="hidden md:block md:col-span-1 sticky top-36 self-start select-none"
    >
      <div className="bg-zinc-900/60 backdrop-blur-xl p-5 rounded-2xl border border-zinc-800/80 shadow-lg space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <Skeleton className="h-4 w-16 rounded bg-zinc-800/80" />
          <Skeleton className="h-4 w-20 rounded-full bg-amber-500/10" />
        </div>

        {/* Search Field */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12 rounded bg-zinc-800/70" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/80" />
        </div>

        {/* Brand Field */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-12 rounded bg-zinc-800/70" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/80" />
        </div>

        {/* Price Tier */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16 rounded bg-zinc-800/70" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/80" />
        </div>

        {/* Minimum Year */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16 rounded bg-zinc-800/70" />
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/80" />
        </div>
      </div>
      <span className="sr-only">Carregando opções de filtros...</span>
    </aside>
  );
}

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface MotorcycleCardSkeletonProps {
  className?: string;
}

export function MotorcycleCardSkeleton({ className }: MotorcycleCardSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando motocicleta..."
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800/80 shadow-sm w-full h-full select-none',
        className,
      )}
    >
      {/* Top Image Container (Aspect-ratio matching MotorcycleCard exactly: 16/10 mobile, 16/9 sm+) */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-zinc-900/60 overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />

        {/* Top Floating Badge Mock */}
        <div className="absolute top-3 left-3 z-10">
          <Skeleton className="h-6 w-20 rounded-full bg-zinc-800/80" />
        </div>

        {/* Dark bottom gradient shadow matching real card */}
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none" />
      </div>

      {/* Card Body matching exact paddings and flex flow */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3 bg-zinc-950">
        {/* Brand & Title */}
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16 rounded bg-zinc-800/80" />
          <Skeleton className="h-5 w-44 rounded bg-zinc-800/90" />
        </div>

        {/* Specs Linha Única (Ano, Km, Motor) */}
        <div className="flex items-center gap-2 pt-0.5">
          <Skeleton className="h-4 w-16 rounded bg-zinc-800/70" />
          <span className="text-zinc-800">•</span>
          <Skeleton className="h-4 w-20 rounded bg-zinc-800/70" />
          <span className="text-zinc-800">•</span>
          <Skeleton className="h-4 w-12 rounded bg-zinc-800/70" />
        </div>

        {/* Preço & Parcelas */}
        <div className="pt-2 border-t border-zinc-800/60 space-y-1">
          <Skeleton className="h-2.5 w-24 rounded bg-zinc-800/50" />
          <div className="flex items-baseline justify-between gap-2">
            <Skeleton className="h-6 w-32 rounded bg-amber-500/20" />
            <Skeleton className="h-4 w-16 rounded bg-zinc-800/50" />
          </div>
        </div>

        {/* Botão de Ação CTA */}
        <div className="pt-1">
          <Skeleton className="h-10 w-full rounded-xl bg-zinc-800/80" />
        </div>
      </div>
      <span className="sr-only">Carregando card da motocicleta...</span>
    </div>
  );
}

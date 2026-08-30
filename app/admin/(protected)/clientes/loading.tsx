import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientesLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-in fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 bg-zinc-800" />
          <Skeleton className="h-8 w-48 bg-zinc-800" />
          <Skeleton className="h-4 w-72 bg-zinc-900" />
        </div>
        <Skeleton className="h-9 w-32 bg-zinc-800" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 bg-zinc-900 rounded-xl" />
        <Skeleton className="h-10 w-36 bg-zinc-900 rounded-xl hidden md:block" />
        <Skeleton className="h-10 w-44 bg-zinc-900 rounded-xl hidden md:block" />
        <Skeleton className="h-10 w-24 bg-zinc-900 rounded-xl" />
      </div>

      {/* Table / Cards Skeleton */}
      <div className="rounded-xl border border-zinc-800/80 bg-[#0f0f13] p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-900/60 last:border-none">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full bg-zinc-800" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-40 bg-zinc-800" />
                <Skeleton className="h-3 w-24 bg-zinc-900" />
              </div>
            </div>
            <Skeleton className="h-4 w-28 bg-zinc-900 hidden sm:block" />
            <Skeleton className="h-6 w-20 bg-zinc-900 rounded-full" />
            <Skeleton className="h-8 w-16 bg-zinc-900 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

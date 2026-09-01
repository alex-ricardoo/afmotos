import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicVehicleReportLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 bg-slate-800" />
            <Skeleton className="h-6 w-48 bg-slate-800" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-lg bg-slate-800" />
          <Skeleton className="h-9 w-28 rounded-lg bg-slate-800" />
        </div>
      </div>

      {/* Hero Card Skeleton */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-32 rounded-xl bg-slate-800" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 bg-slate-800" />
            <Skeleton className="h-7 w-64 bg-slate-800" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-xl bg-slate-800/80" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl bg-slate-800/50" />
        <Skeleton className="h-24 rounded-xl bg-slate-800/50" />
        <Skeleton className="h-24 rounded-xl bg-slate-800/50" />
      </div>
    </div>
  );
}

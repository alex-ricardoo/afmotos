import React from 'react';

export default function CustomerDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Banner Skeleton */}
      <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800/60 p-8 h-44 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="h-5 w-32 bg-zinc-800 rounded-full" />
          <div className="h-8 w-64 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-zinc-800 rounded" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 h-24" />
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 h-24" />
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-5 h-24" />
      </div>

      {/* Recent Consultations Skeleton */}
      <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/60 p-6 space-y-4">
        <div className="h-6 w-48 bg-zinc-800 rounded" />
        <div className="h-4 w-72 bg-zinc-800 rounded" />
        <div className="divide-y divide-zinc-800/60 pt-4">
          <div className="py-4 h-16" />
          <div className="py-4 h-16" />
          <div className="py-4 h-16" />
        </div>
      </div>
    </div>
  );
}

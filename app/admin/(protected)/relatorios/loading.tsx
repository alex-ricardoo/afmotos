import React from 'react';

export default function ReportsLoading() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-900">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-zinc-900 rounded-2xl" />
          <div className="h-4 w-96 bg-zinc-900/60 rounded-xl" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-zinc-900 rounded-2xl" />
          <div className="h-10 w-28 bg-[#c9a44c]/20 rounded-2xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="h-12 w-full bg-zinc-900/80 rounded-2xl" />

      {/* KPIs Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="h-36 bg-zinc-950/70 border border-zinc-900 rounded-3xl p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-24 bg-zinc-900 rounded-sm" />
              <div className="w-8 h-8 rounded-xl bg-zinc-900" />
            </div>
            <div className="h-8 w-32 bg-zinc-900 rounded-md" />
            <div className="h-3 w-20 bg-zinc-900 rounded-sm pt-2" />
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-zinc-950/70 border border-zinc-900 rounded-3xl p-6" />
        <div className="h-80 bg-zinc-950/70 border border-zinc-900 rounded-3xl p-6" />
      </div>
    </div>
  );
}

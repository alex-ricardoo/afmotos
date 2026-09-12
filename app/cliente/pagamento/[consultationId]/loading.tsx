import React from 'react';

export default function PaymentLoading() {
  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 space-y-8 animate-pulse">
      {/* Stepper skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
        <div className="h-4 w-28 bg-zinc-800 rounded" />
        <div className="h-5 w-60 bg-zinc-800/80 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-8 h-48 flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-zinc-800 rounded-full" />
              <div className="h-7 w-64 bg-zinc-800 rounded-xl" />
              <div className="h-4 w-80 bg-zinc-850 rounded" />
            </div>
            <div className="h-24 w-44 bg-zinc-800 rounded-xl hidden sm:block" />
          </div>

          <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-7 space-y-4">
            <div className="h-5 w-48 bg-zinc-800 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-20 bg-zinc-900/50 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-7 space-y-5">
            <div className="h-4 w-32 bg-zinc-800 rounded" />
            <div className="h-24 bg-zinc-900/60 rounded-2xl" />
            <div className="h-16 bg-zinc-900/40 rounded-2xl" />
            <div className="space-y-3">
              <div className="h-16 bg-zinc-900/60 rounded-2xl" />
              <div className="h-16 bg-zinc-900/60 rounded-2xl" />
              <div className="h-16 bg-zinc-900/60 rounded-2xl" />
            </div>
            <div className="h-14 bg-zinc-800 rounded-2xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

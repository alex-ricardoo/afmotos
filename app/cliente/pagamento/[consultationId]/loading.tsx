import React from 'react';

export default function PaymentLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-pulse py-4 sm:py-8 px-4 sm:px-6">
      <div className="h-4 w-28 bg-zinc-800/80 rounded" />

      <div className="space-y-1">
        <div className="h-7 w-56 bg-zinc-800/80 rounded" />
        <div className="h-4 w-72 bg-zinc-800/50 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/40 space-y-4">
            <div className="h-4 w-32 bg-zinc-800/70 rounded" />
            <div className="h-16 w-full bg-zinc-800/40 rounded-xl" />
            <div className="h-8 w-full bg-zinc-800/30 rounded" />
          </div>

          <div className="rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/40 space-y-3">
            <div className="h-4 w-28 bg-zinc-800/70 rounded" />
            <div className="h-5 w-full bg-zinc-800/30 rounded" />
            <div className="h-5 w-full bg-zinc-800/30 rounded" />
            <div className="h-5 w-full bg-zinc-800/30 rounded" />
            <div className="h-5 w-full bg-zinc-800/30 rounded" />
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/40 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800/60">
              <div className="h-5 w-36 bg-zinc-800/70 rounded" />
              <div className="h-6 w-24 bg-zinc-800/70 rounded" />
            </div>
            <div className="h-12 w-full bg-zinc-800/50 rounded-xl" />
            <div className="h-12 w-full bg-zinc-800/30 rounded-xl" />
            <div className="h-12 w-full bg-zinc-800/30 rounded-xl" />
            <div className="h-12 w-full bg-zinc-800/50 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

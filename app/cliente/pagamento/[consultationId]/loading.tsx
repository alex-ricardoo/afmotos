import React from 'react';

export default function PaymentLoading() {
  return (
    <div className="max-w-xl mx-auto py-6 sm:py-10 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-7 h-48 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 bg-zinc-800 rounded" />
          <div className="h-7 w-60 bg-zinc-800 rounded-xl" />
        </div>
        <div className="h-8 w-40 bg-zinc-800 rounded" />
      </div>

      {/* Methods skeleton */}
      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-7 space-y-4">
        <div className="h-4 w-48 bg-zinc-800 rounded" />
        <div className="space-y-3 pt-2">
          <div className="h-16 bg-zinc-900/60 rounded-2xl" />
          <div className="h-16 bg-zinc-900/60 rounded-2xl" />
          <div className="h-16 bg-zinc-900/60 rounded-2xl" />
        </div>
        <div className="h-12 bg-zinc-800 rounded-xl mt-4" />
      </div>
    </div>
  );
}

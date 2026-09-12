import React from 'react';

export default function PaymentLoading() {
  return (
    <div className="max-w-xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-28 bg-zinc-800 rounded" />

      {/* Main card skeleton */}
      <div className="rounded-3xl bg-gradient-to-b from-[#0e121a] via-[#090c13] to-[#07090f] border border-zinc-800/90 p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-zinc-800 rounded" />
            <div className="h-6 w-48 bg-zinc-800 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-zinc-800 rounded-lg" />
        </div>

        <div className="h-24 bg-zinc-900/60 rounded-2xl" />

        <div className="space-y-3 pt-2">
          <div className="h-4 w-36 bg-zinc-800 rounded" />
          <div className="h-16 bg-zinc-900/50 rounded-2xl" />
          <div className="h-16 bg-zinc-900/50 rounded-2xl" />
          <div className="h-16 bg-zinc-900/50 rounded-2xl" />
        </div>

        <div className="h-10 bg-zinc-900/40 rounded-xl" />
        <div className="h-13 bg-zinc-800 rounded-xl" />
      </div>
    </div>
  );
}

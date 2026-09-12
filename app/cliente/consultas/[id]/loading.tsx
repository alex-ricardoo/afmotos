import React from 'react';

export default function ConsultationDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-5 w-48 bg-zinc-800 rounded" />

      {/* Header card skeleton */}
      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-8 h-48 flex items-center gap-6">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800 shrink-0" />
        <div className="space-y-3 flex-1">
          <div className="h-6 w-32 bg-zinc-800 rounded" />
          <div className="h-8 w-72 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-96 max-w-full bg-zinc-800 rounded" />
        </div>
      </div>

      {/* Badges skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 h-16" />
        ))}
      </div>

      {/* Details grid skeleton */}
      <div className="rounded-3xl bg-zinc-950/60 border border-zinc-800/80 p-8 space-y-6">
        <div className="h-6 w-56 bg-zinc-800 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-zinc-800 rounded" />
              <div className="h-5 w-32 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

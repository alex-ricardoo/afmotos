import React from 'react';

export default function ConsultasLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-zinc-800 rounded-lg" />
          <div className="h-4 w-32 bg-zinc-800 rounded" />
        </div>
        <div className="h-10 w-64 bg-zinc-800 rounded-xl" />
      </div>

      <div className="rounded-3xl bg-zinc-950/60 border border-zinc-800/80 p-6 space-y-4">
        <div className="h-12 bg-zinc-900/60 rounded-xl" />
        <div className="h-12 bg-zinc-900/40 rounded-xl" />
        <div className="h-12 bg-zinc-900/60 rounded-xl" />
        <div className="h-12 bg-zinc-900/40 rounded-xl" />
        <div className="h-12 bg-zinc-900/60 rounded-xl" />
      </div>
    </div>
  );
}

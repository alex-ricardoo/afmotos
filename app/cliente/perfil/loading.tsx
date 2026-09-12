import React from 'react';

export default function ProfileLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 bg-zinc-800 rounded-lg" />
        <div className="h-4 w-64 bg-zinc-800 rounded" />
      </div>

      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-8 space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-zinc-800/80">
          <div className="w-24 h-24 rounded-2xl bg-zinc-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 bg-zinc-800 rounded" />
            <div className="h-4 w-36 bg-zinc-800 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 bg-zinc-800 rounded" />
              <div className="h-11 bg-zinc-900 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

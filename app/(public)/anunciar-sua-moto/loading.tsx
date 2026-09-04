import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AnunciarMotoLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando formulário de anúncio..."
      className="bg-zinc-950 min-h-screen text-zinc-100 py-10 px-4 md:px-8 space-y-10 animate-in fade-in-50 duration-150 max-w-5xl mx-auto"
    >
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Skeleton className="h-4 w-36 mx-auto rounded-full bg-amber-500/20" />
        <Skeleton className="h-10 w-3/4 mx-auto rounded-xl bg-zinc-800/90" />
        <Skeleton className="h-4 w-5/6 mx-auto rounded bg-zinc-800/60" />
      </div>

      {/* Form Container */}
      <div className="bg-zinc-900/60 rounded-3xl p-6 sm:p-10 border border-zinc-800/80 shadow-xl space-y-6">
        <div className="space-y-2 pb-4 border-b border-zinc-800/80">
          <Skeleton className="h-6 w-48 rounded-lg bg-zinc-800/80" />
          <Skeleton className="h-4 w-80 max-w-full rounded bg-zinc-800/60" />
        </div>

        {/* Input fields mock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded bg-zinc-800/70" />
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-800/80" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded bg-zinc-800/70" />
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-800/80" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded bg-zinc-800/70" />
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-800/80" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded bg-zinc-800/70" />
            <Skeleton className="h-12 w-full rounded-xl bg-zinc-800/80" />
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4">
          <Skeleton className="h-14 w-full rounded-2xl bg-amber-500/20" />
        </div>
      </div>
      <span className="sr-only">Carregando tela de anúncio e consignação da AF Motos...</span>
    </div>
  );
}

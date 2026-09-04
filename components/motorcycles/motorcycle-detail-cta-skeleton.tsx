import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function MotorcycleDetailCtaSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando proposta da moto..."
      className="bg-[#151515] rounded-3xl p-6 sm:p-7 border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] space-y-6 select-none"
    >
      {/* Header Info */}
      <div className="space-y-2.5 pb-4 border-b border-amber-500/20">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3.5 w-20 rounded bg-amber-500/30" />
          <Skeleton className="h-6 w-24 rounded-full bg-zinc-800/80" />
        </div>
        <Skeleton className="h-8 w-4/5 rounded-xl bg-zinc-800/90" />
        <Skeleton className="h-4 w-32 rounded bg-zinc-800/60" />
      </div>

      {/* Price & Installments */}
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-20 rounded bg-zinc-800/60" />
        <Skeleton className="h-10 sm:h-12 w-48 rounded-xl bg-amber-400/20" />
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <Skeleton className="h-4 w-36 rounded bg-zinc-800/80" />
          <Skeleton className="h-3 w-52 rounded bg-zinc-800/60" />
        </div>
      </div>

      {/* CTA Button (WhatsApp Action) */}
      <div className="pt-2">
        <Skeleton className="h-14 w-full rounded-2xl bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_20px_rgba(37,211,102,0.15)]" />
      </div>

      {/* Trust & Guarantee Badges */}
      <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="w-4 h-4 rounded-full bg-amber-400/30 shrink-0" />
            <Skeleton className="h-3.5 w-48 rounded bg-zinc-800/70" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando bloco de compra da motocicleta...</span>
    </div>
  );
}

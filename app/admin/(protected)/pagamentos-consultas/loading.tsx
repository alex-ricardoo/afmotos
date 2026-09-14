import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function LoadingAdminPaymentsPage() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-64 rounded-xl bg-zinc-800" />
          <div className="h-4 w-96 rounded-lg bg-zinc-900" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-zinc-800" />
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-zinc-900/60 border border-zinc-900" />
        ))}
      </div>

      {/* Filter Bar Skeleton */}
      <div className="h-24 rounded-2xl bg-zinc-900/60 border border-zinc-900" />

      {/* Table Skeleton */}
      <div className="rounded-2xl border border-zinc-900 bg-[#0e0e12] p-12 text-center space-y-3">
        <RefreshCw className="h-6 w-6 animate-spin text-[#c9a44c] mx-auto opacity-50" />
        <p className="text-xs text-zinc-500">Carregando painel operacional de pagamentos...</p>
      </div>
    </div>
  );
}

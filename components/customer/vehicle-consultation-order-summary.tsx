'use client';

import React from 'react';
import { CustomerPlateBadge } from './customer-plate-badge';
import { Sparkles } from 'lucide-react';

interface VehicleConsultationOrderSummaryProps {
  plate: string;
  amount?: number;
  className?: string;
}

export function VehicleConsultationOrderSummary({
  plate,
  className = '',
}: VehicleConsultationOrderSummaryProps) {
  return (
    <section
      aria-label="Veículo da consulta"
      className={`relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-zinc-900/95 via-zinc-900/80 to-zinc-950 p-5 sm:p-6 shadow-xl backdrop-blur-md ${className}`}
    >
      {/* Subtle brand glow in background */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-4">
        {/* Header line: Title + discrete badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
            Histórico Veicular Oficial
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Laudo completo
          </span>
        </div>

        {/* Plate display - Clean, authentic and without duplicated text or price */}
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <span className="text-xs text-zinc-400 font-medium mb-3">Placa do Veículo</span>
          <CustomerPlateBadge plate={plate} size="lg" className="shadow-lg" />
        </div>
      </div>
    </section>
  );
}

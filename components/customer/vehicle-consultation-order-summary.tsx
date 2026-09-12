'use client';

import React from 'react';
import { CustomerPlateBadge } from './customer-plate-badge';
import { ShieldCheck } from 'lucide-react';

interface VehicleConsultationOrderSummaryProps {
  plate: string;
  amount?: number;
  className?: string;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function VehicleConsultationOrderSummary({
  plate,
  amount,
  className = '',
}: VehicleConsultationOrderSummaryProps) {
  const formattedAmount = amount ? currencyFormatter.format(amount) : null;

  return (
    <section
      aria-label="Resumo da consulta veicular"
      className={`rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/40 ${className}`}
    >
      <div className="space-y-4">
        {/* Header: Title and Type */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400/90">
              Histórico Veicular
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Laudo Completo
            </h2>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Oficial
          </span>
        </div>

        {/* Plate display */}
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <span className="text-xs text-zinc-400 mb-2">Placa consultada</span>
          <CustomerPlateBadge plate={plate} size="lg" />
        </div>

        {/* Total price display */}
        {formattedAmount && (
          <div className="flex items-baseline justify-between pt-2 border-t border-zinc-800/60">
            <div className="space-y-0.5">
              <span className="text-xs text-zinc-400">Total da consulta</span>
              <p className="text-[11px] text-zinc-400">Pagamento único • Sem mensalidade</p>
            </div>
            <span className="text-xl sm:text-2xl font-black text-white tabular-nums tracking-tight">
              {formattedAmount}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

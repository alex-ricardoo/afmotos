'use client';

import React from 'react';
import { CustomerPlateBadge } from './customer-plate-badge';
import { Sparkles, CheckCircle2 } from 'lucide-react';

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
      className={`rounded-2xl border border-zinc-800/90 bg-zinc-900/70 p-5 sm:p-6 shadow-xl backdrop-blur-md ${className}`}
    >
      <div className="flex flex-col gap-4">
        {/* Header: Title + discrete badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Histórico Veicular Oficial
            </h2>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Laudo Completo
          </span>
        </div>

        {/* Plate display */}
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <span className="text-xs text-zinc-400 font-medium mb-2.5">Placa do Veículo</span>
          <CustomerPlateBadge plate={plate} size="lg" className="shadow-lg" />
        </div>

        {/* Price & Single Payment Details */}
        {formattedAmount && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-zinc-300 block">Valor do laudo</span>
              <span className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Pagamento único • Sem assinatura
              </span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-amber-400">{formattedAmount}</span>
          </div>
        )}
      </div>
    </section>
  );
}

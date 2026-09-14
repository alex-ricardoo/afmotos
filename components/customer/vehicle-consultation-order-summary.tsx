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
      className={`relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 p-5 sm:p-6 shadow-xl backdrop-blur-xl ${className}`}
    >
      <div className="space-y-4">
        {/* Header: Title and Type */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              Histórico Veicular
            </span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              Laudo Oficial Completo
            </h2>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400 border border-amber-500/25 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Certificado
          </span>
        </div>

        {/* Plate display */}
        <div className="flex flex-col items-center justify-center py-3 px-2 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center shadow-inner">
          <span className="text-[11px] font-medium text-zinc-400 mb-2">
            Placa veicular consultada
          </span>
          <CustomerPlateBadge plate={plate} size="lg" />
        </div>

        {/* Total price display (único e direto) */}
        {formattedAmount && (
          <div className="flex items-baseline justify-between pt-3 border-t border-zinc-800/80">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-zinc-200">Valor da Consulta</span>
              <p className="text-[10px] text-zinc-400">Pagamento único • Sem mensalidade</p>
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

'use client';

import React from 'react';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CONSULTATION_PRICE_BRL } from '@/lib/customer/types';

interface PlateConsultationSummaryProps {
  plate: string;
  onProceed?: () => void;
  isProcessing?: boolean;
}

export function PlateConsultationSummary({
  plate,
  onProceed,
  isProcessing = false,
}: PlateConsultationSummaryProps) {
  const formattedPlate = formatBrazilianPlate(plate);

  const includedItems = [
    'Dados cadastrais e Renavam oficial',
    'Débitos de IPVA, DPVAT e licenciamento',
    'Multas ativas e autuações municipais/estaduais',
    'Restrições judiciais, Renajud e roubo/furto',
    'Indício de leilão e sinistro',
    'Gravame financeiro e alienação fiduciária',
  ];

  return (
    <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div>
            <span className="text-xs font-semibold text-[#c9a44c] uppercase tracking-wider">
              Resumo do Laudo
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Consulta Veicular Completa
            </h3>
          </div>

          <div className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 flex items-center justify-center">
            <span className="font-mono font-bold text-lg text-white tracking-widest">
              {formattedPlate}
            </span>
          </div>
        </div>

        {/* Benefits list */}
        <div className="space-y-2.5">
          <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">
            O que está incluso nesta consulta:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
            {includedItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-zinc-400">Valor da consulta:</span>
            <p className="text-2xl font-black text-white">
              R$ {CONSULTATION_PRICE_BRL.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {onProceed && (
            <Button
              onClick={onProceed}
              disabled={isProcessing}
              className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:from-[#d8b35b] hover:to-[#c49e49] text-zinc-950 font-bold rounded-xl shadow-lg shadow-[#c9a44c]/20 flex items-center justify-center gap-2"
            >
              <span>Continuar para Pagamento</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

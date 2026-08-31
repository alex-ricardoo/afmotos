import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface VehicleHistoryDisclaimerProps {
  customDisclaimer?: string;
}

export function VehicleHistoryDisclaimer({
  customDisclaimer,
}: VehicleHistoryDisclaimerProps) {
  const disclaimerText =
    customDisclaimer ||
    'O relatório de histórico veicular reúne informações disponibilizadas por bases de dados integradas na data da consulta. Ele serve como ferramenta de auxílio e suporte à decisão, mas não substitui a vistoria mecânica presencial, conferência de documentos e avaliação física da motocicleta.';

  return (
    <section className="py-14 sm:py-16 bg-zinc-900/40 border-t border-white/5 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Transparência e Limitações do Serviço
              </h3>
              <p className="text-xs text-zinc-400">
                Informação clara para uma compra consciente e segura.
              </p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            {disclaimerText}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-400">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Consulta vinculada estritamente à placa informada.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Dados emitidos conforme disponibilidade das bases integradas.</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Recomendamos vistoria física e teste mecânico antes da compra.</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Conferência de documentos e recibo oficial de transferência.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

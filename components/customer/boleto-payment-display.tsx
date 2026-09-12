'use client';

import React from 'react';
import { FileText, ExternalLink, RefreshCw, Clock } from 'lucide-react';

interface BoletoPaymentDisplayProps {
  ticketUrl: string;
  onRefreshStatus?: () => void;
  isChecking?: boolean;
}

export function BoletoPaymentDisplay({
  ticketUrl,
  onRefreshStatus,
  isChecking = false,
}: BoletoPaymentDisplayProps) {
  return (
    <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 p-6 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <FileText className="h-7 w-7" aria-hidden="true" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-white mb-1">Boleto Bancário Emitido</h3>
      <p className="text-xs text-zinc-400 mb-6 max-w-md mx-auto leading-relaxed">
        Seu boleto foi gerado pelo Mercado Pago. Clique abaixo para visualizá-lo, imprimir ou copiar
        a linha digitável no aplicativo do seu banco.
      </p>

      {/* Primary Action Button */}
      <div className="mb-6">
        <a
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-950/30 transition-colors w-full sm:w-auto"
        >
          <span>Visualizar Boleto Bancário</span>
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      {/* Information & Refresh Box */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-4 text-left">
        <div className="flex items-center gap-2.5 text-xs text-zinc-400">
          <Clock className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span className="leading-snug">
            Compensação em até 1 a 2 dias úteis. A liberação do laudo é automática.
          </span>
        </div>

        {onRefreshStatus && (
          <button
            onClick={onRefreshStatus}
            disabled={isChecking}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar Status'}
          </button>
        )}
      </div>
    </div>
  );
}

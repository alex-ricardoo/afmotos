'use client';

import React from 'react';
import { AlertTriangle, ExternalLink, Filter, Wallet } from 'lucide-react';

interface InsufficientCreditsBannerProps {
  count: number;
  onFilterClick?: () => void;
  isFiltered?: boolean;
}

export function InsufficientCreditsBanner({
  count,
  onFilterClick,
  isFiltered,
}: InsufficientCreditsBannerProps) {
  if (count <= 0) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="relative overflow-hidden rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/60 via-amber-950/40 to-black p-4 sm:p-5 text-zinc-100 shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all animate-in fade-in duration-300"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Lado Esquerdo: Ícone + Descrição */}
        <div className="flex items-start gap-3.5">
          <div className="relative rounded-2xl bg-red-500/20 p-3 text-red-400 border border-red-500/40 shrink-0">
            <AlertTriangle className="h-6 w-6 animate-pulse text-red-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                Atenção: {count} {count === 1 ? 'consulta retida' : 'consultas retidas'} por saldo
                insuficiente na API Brasil
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/50">
                HTTP 402
              </span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
              O cliente realizou o pagamento via Mercado Pago, porém a API Brasil não possui
              créditos corporativos para gerar o laudo.
              <strong className="text-amber-300"> Recarregue a conta da API Brasil</strong> e em
              seguida clique em <em>Reprocessar</em>, ou realize o <em>Estorno integral</em>.
            </p>
          </div>
        </div>

        {/* Lado Direito: Botões de Ação Imediata */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-red-900/40">
          {onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex-1 sm:flex-initial shadow-sm ${
                isFiltered
                  ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)] ring-2 ring-amber-300'
                  : 'bg-zinc-900 text-amber-300 border border-amber-500/40 hover:bg-amber-950/60'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>{isFiltered ? 'Filtro Aplicado' : `Ver as ${count} Retidas`}</span>
            </button>
          )}

          <a
            href="https://apibrasil.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#c9a44c] hover:bg-[#d9b45c] text-black shadow-[0_0_15px_rgba(201,164,76,0.3)] transition-all cursor-pointer flex-1 sm:flex-initial"
          >
            <Wallet className="h-4 w-4 fill-current" />
            <span>Recarregar API Brasil</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}

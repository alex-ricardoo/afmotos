'use client';

import React from 'react';
import { Search, X, AlertCircle, Clock, Undo2, SlidersHorizontal } from 'lucide-react';

export interface FilterState {
  search: string;
  purpose: string;
  status: string;
  deliveryStatus: string;
  refundStatus: string;
  insufficientCreditsOnly: boolean;
  approvedWithoutReportOnly: boolean;
  pendingRefundsOnly: boolean;
}

interface PaymentsFiltersBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onReset: () => void;
  isLoading?: boolean;
}

export function PaymentsFiltersBar({
  filters,
  onFilterChange,
  onReset,
  isLoading,
}: PaymentsFiltersBarProps) {
  const activeCount = [
    Boolean(filters.search),
    Boolean(filters.purpose),
    Boolean(filters.status),
    Boolean(filters.deliveryStatus),
    Boolean(filters.refundStatus),
    filters.insufficientCreditsOnly,
    filters.approvedWithoutReportOnly,
    filters.pendingRefundsOnly,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md p-4 text-zinc-100 shadow-lg">
      {/* Linha 1: Campo de Busca e Selects Principais */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Campo de Busca Principal */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por placa, pacote, ID do pedido, transação, MP payment, nome ou e-mail..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full rounded-xl bg-zinc-900/90 border border-zinc-800 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#c9a44c] focus:ring-2 focus:ring-[#c9a44c]/20 transition-all shadow-inner"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns de Filtro */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Tipo de Operação */}
          <select
            aria-label="Filtrar por Tipo de Operação"
            value={filters.purpose}
            onChange={(e) => onFilterChange({ purpose: e.target.value })}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 cursor-pointer shadow-xs"
          >
            <option value="">Tipo (Todos)</option>
            <option value="vehicle_consultation">🚗 Consultas Veiculares</option>
            <option value="credit_package">📦 Pacotes de Créditos</option>
          </select>

          {/* Status do Pagamento */}
          <select
            aria-label="Filtrar por Status de Pagamento"
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 cursor-pointer shadow-xs"
          >
            <option value="">Pagamento (Todos)</option>
            <option value="approved">✅ Aprovado</option>
            <option value="pending">⏳ Pendente</option>
            <option value="refunded">↩️ Estornado</option>
            <option value="rejected">❌ Rejeitado</option>
            <option value="cancelled">🚫 Cancelado</option>
          </select>

          {/* Status do Laudo */}
          <select
            aria-label="Filtrar por Status do Laudo"
            value={filters.deliveryStatus}
            onChange={(e) => onFilterChange({ deliveryStatus: e.target.value })}
            className="rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 cursor-pointer shadow-xs"
          >
            <option value="">Laudo (Todos)</option>
            <option value="completed">📄 Concluído</option>
            <option value="processing">⚙️ Em Processamento</option>
            <option value="retry_scheduled">🔁 Retry Agendado</option>
            <option value="failed_permanent">❌ Falha Permanente</option>
          </select>

          {/* Status de Estorno */}
          <select
            aria-label="Filtrar por Status de Estorno"
            value={filters.refundStatus}
            onChange={(e) => onFilterChange({ refundStatus: e.target.value })}
            className="col-span-2 sm:col-span-1 rounded-xl bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 cursor-pointer shadow-xs"
          >
            <option value="">Estorno (Todos)</option>
            <option value="none">Sem Estorno</option>
            <option value="requested">Solicitado</option>
            <option value="pending">Pendente no Gateway</option>
            <option value="confirmed">Confirmado</option>
            <option value="failed">Falhou</option>
          </select>

          {/* Botão de Limpar */}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-rose-950/40 text-rose-300 border border-rose-900/60 hover:bg-rose-900/50 transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpar ({activeCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Linha 2: Pílulas de Atalhos Operacionais */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#c9a44c]" />
          <span>Atalhos Rápidos:</span>
        </span>

        {/* Atalho 1: Saldo API Brasil Insuficiente */}
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              insufficientCreditsOnly: !filters.insufficientCreditsOnly,
            })
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filters.insufficientCreditsOnly
              ? 'bg-red-500 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.5)] ring-2 ring-red-400'
              : 'bg-red-950/25 text-red-300 border border-red-900/50 hover:bg-red-900/30'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          <span>Saldo API Brasil Insuficiente</span>
        </button>

        {/* Atalho 2: Aprovados sem Laudo */}
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              approvedWithoutReportOnly: !filters.approvedWithoutReportOnly,
            })
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filters.approvedWithoutReportOnly
              ? 'bg-amber-400 text-black font-bold shadow-[0_0_12px_rgba(251,191,36,0.5)] ring-2 ring-amber-300'
              : 'bg-amber-950/25 text-amber-300 border border-amber-900/50 hover:bg-amber-900/30'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Aprovados sem Laudo</span>
        </button>

        {/* Atalho 3: Estornos Pendentes ou com Falha */}
        <button
          type="button"
          onClick={() =>
            onFilterChange({
              pendingRefundsOnly: !filters.pendingRefundsOnly,
            })
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            filters.pendingRefundsOnly
              ? 'bg-yellow-400 text-black font-bold shadow-[0_0_12px_rgba(250,204,21,0.5)] ring-2 ring-yellow-300'
              : 'bg-yellow-950/25 text-yellow-300 border border-yellow-900/50 hover:bg-yellow-900/30'
          }`}
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span>Estornos Pendentes / Falhos</span>
        </button>
      </div>
    </div>
  );
}

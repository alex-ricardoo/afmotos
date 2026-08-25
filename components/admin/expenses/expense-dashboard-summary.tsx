'use client';

import {
  DollarSign,
  CheckCircle2,
  Clock,
  Bike,
  Store,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { ExpenseSummaryMetrics } from '@/types/expenses';

interface ExpenseDashboardSummaryProps {
  summary: ExpenseSummaryMetrics;
  selectedMonthLabel: string;
}

export function ExpenseDashboardSummary({
  summary,
  selectedMonthLabel,
}: ExpenseDashboardSummaryProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const isPositiveComparison =
    summary.comparisonPercentage !== undefined &&
    summary.comparisonPercentage !== null &&
    summary.comparisonPercentage > 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {/* 1. Total do Mês */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total do Mês</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold text-white tracking-tight font-mono">
            {formatCurrency(summary.totalMonth)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            {summary.comparisonPercentage !== null && summary.comparisonPercentage !== undefined ? (
              <span
                className={`inline-flex items-center gap-0.5 font-bold ${
                  isPositiveComparison ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {isPositiveComparison ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(summary.comparisonPercentage).toFixed(1)}%
              </span>
            ) : null}
            <span className="text-slate-400 font-medium truncate">{selectedMonthLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. Pago */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl hover:border-emerald-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total Pago</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold text-emerald-400 tracking-tight font-mono">
            {formatCurrency(summary.totalPaid)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Despesas quitadas</p>
        </div>
      </div>

      {/* 3. Pendente */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl hover:border-amber-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total Pendente</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold text-amber-400 tracking-tight font-mono">
            {formatCurrency(summary.totalPending)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Compromissos a pagar</p>
        </div>
      </div>

      {/* 4. Gastos de Motos */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl hover:border-cyan-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Gastos com Motos</span>
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <Bike className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold text-cyan-400 tracking-tight font-mono">
            {formatCurrency(summary.totalMoto)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Peças e manutenção</p>
        </div>
      </div>

      {/* 5. Gastos da Loja */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl hover:border-purple-500/30 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Custos da Loja</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold text-purple-400 tracking-tight font-mono">
            {formatCurrency(summary.totalStore)}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Custos operacionais</p>
        </div>
      </div>

      {/* 6. Quantidade de Lançamentos */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Lançamentos</span>
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-xl font-bold text-white tracking-tight font-mono">{summary.count}</div>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">Registros cadastrados</p>
        </div>
      </div>
    </div>
  );
}

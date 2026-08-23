import React from 'react';
import { DollarSign, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';
import { SalesMetrics } from '@/lib/queries/sales';

interface SalesSummaryProps {
  metrics: SalesMetrics;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function SalesSummary({ metrics }: SalesSummaryProps) {
  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total Geral Vendido */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-[#c9a44c]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Volume Total
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <DollarSign className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
            {formatCurrency(metrics.totalSalesValue)}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Faturamento acumulado</p>
        </div>
      </div>

      {/* 2. Vendas no Mês Atual */}
      <div className="bg-zinc-950/70 border border-emerald-500/25 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-400/90 uppercase tracking-wider">
            Em {capitalizedMonth}
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-400 font-mono">
            {formatCurrency(metrics.monthSalesValue)}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Faturamento no mês vigente</p>
        </div>
      </div>

      {/* 3. Qtd Vendas Mês */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Vendas ({capitalizedMonth})
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Calendar className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
            {metrics.monthSalesCount} {metrics.monthSalesCount === 1 ? 'moto' : 'motos'}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Negócios fechados no mês</p>
        </div>
      </div>

      {/* 4. Total de Vendas Histórico */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Total Histórico
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
            {metrics.totalSalesCount} {metrics.totalSalesCount === 1 ? 'veículo' : 'veículos'}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Total de recibos emitidos</p>
        </div>
      </div>
    </div>
  );
}

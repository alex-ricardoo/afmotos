'use client';

import React, { useState } from 'react';
import { Trophy, TrendingUp, Calendar, Info, DollarSign } from 'lucide-react';
import { MonthlySalesData } from '@/lib/queries/dashboard';

interface SalesAnalyticsChartProps {
  data: MonthlySalesData[];
  bestMonth: {
    label: string;
    revenue: number;
    count: number;
  } | null;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function SalesAnalyticsChart({ data, bestMonth }: SalesAnalyticsChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1000);
  const totalPeriodRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
  const totalPeriodBikes = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-6">
      {/* Header with Title & Best Month Trophy Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 rounded-full bg-[#c9a44c]" />
            <h3 className="font-bold text-base text-white">Evolução do Faturamento & Vendas</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Desempenho financeiro consolidado nos últimos 6 meses.
          </p>
        </div>

        {bestMonth && bestMonth.revenue > 0 && (
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs">
            <Trophy className="w-4 h-4 text-[#e3c56c] shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Mês Recorde de Vendas
              </span>
              <span className="text-xs font-black text-[#e3c56c]">
                {bestMonth.label} • {formatCurrency(bestMonth.revenue)} ({bestMonth.count} motos)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/50">
        <div>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Faturamento no Semestre
          </span>
          <span className="text-sm sm:text-base font-extrabold text-white">
            {formatCurrency(totalPeriodRevenue)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Motos Vendidas
          </span>
          <span className="text-sm sm:text-base font-extrabold text-sky-400">
            {totalPeriodBikes} {totalPeriodBikes === 1 ? 'veículo' : 'veículos'}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Média Mensal
          </span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-400">
            {formatCurrency(totalPeriodRevenue / (data.length || 1))}
          </span>
        </div>
      </div>

      {/* Interactive Bar Chart Visualization */}
      <div className="space-y-2 pt-2">
        <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6 relative">
          {/* Subtle Background Guide Lines */}
          <div className="absolute inset-x-0 top-6 border-b border-zinc-800/40 border-dashed" />
          <div className="absolute inset-x-0 top-1/2 border-b border-zinc-800/40 border-dashed" />
          <div className="absolute inset-x-0 bottom-0 border-b border-zinc-800" />

          {data.map((item, index) => {
            const heightPct = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
            const isBest = bestMonth && bestMonth.label === item.fullLabel && item.revenue > 0;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.monthKey}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer z-10"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 bg-zinc-950 border border-[#c9a44c]/60 rounded-xl p-2 shadow-2xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] text-zinc-400 font-medium text-center">
                      {item.fullLabel}
                    </div>
                    <div className="text-xs font-black text-[#e3c56c] text-center">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-[10px] text-zinc-300 text-center font-bold">
                      {item.count} {item.count === 1 ? 'moto vendida' : 'motos vendidas'}
                    </div>
                  </div>
                )}

                {/* Bar Value on top if active or best */}
                {item.revenue > 0 && (
                  <span
                    className={`text-[10px] font-bold mb-1 transition-all ${
                      isBest ? 'text-[#e3c56c]' : 'text-zinc-400'
                    }`}
                  >
                    {item.revenue >= 1000
                      ? `R$ ${(item.revenue / 1000).toFixed(0)}k`
                      : `R$ ${item.revenue}`}
                  </span>
                )}

                {/* Animated Gradient Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 relative overflow-hidden ${
                    isBest
                      ? 'bg-gradient-to-t from-[#c9a44c] via-[#e3c56c] to-amber-300 shadow-[0_0_20px_rgba(201,164,76,0.3)]'
                      : isHovered
                        ? 'bg-gradient-to-t from-zinc-700 via-zinc-500 to-zinc-300'
                        : item.revenue > 0
                          ? 'bg-gradient-to-t from-zinc-800 via-zinc-700 to-zinc-600'
                          : 'bg-zinc-900/60'
                  }`}
                >
                  {isBest && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* X-Axis Month Labels */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 pt-2 text-center">
          {data.map((item) => (
            <div key={item.monthKey} className="flex-1">
              <span className="text-xs font-semibold text-zinc-400 block truncate">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

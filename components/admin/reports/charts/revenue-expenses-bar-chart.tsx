'use client';

import React, { useState } from 'react';
import { formatCurrencyBRL, formatCompactCurrencyBRL } from '@/lib/reports/formatters';

interface RevenueExpensesEvolutionItem {
  periodKey: string;
  label: string;
  fullLabel: string;
  revenue: number;
  expenses: number;
  operatingResult: number;
  salesCount: number;
}

interface RevenueExpensesBarChartProps {
  data: RevenueExpensesEvolutionItem[];
}

export function RevenueExpensesBarChart({ data }: RevenueExpensesBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 5000);
  const totalRevenue = data.reduce((acc, d) => acc + d.revenue, 0);
  const totalBikes = data.reduce((acc, d) => acc + d.salesCount, 0);

  return (
    <div className="space-y-6">
      {/* Mini Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60">
        <div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
            Faturamento Acumulado
          </span>
          <span className="text-sm sm:text-base font-extrabold text-white">
            {formatCurrencyBRL(totalRevenue)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
            Motos Comercializadas
          </span>
          <span className="text-sm sm:text-base font-extrabold text-sky-400">
            {totalBikes} {totalBikes === 1 ? 'veículo' : 'veículos'}
          </span>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
            Média por Mês
          </span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-400">
            {formatCurrencyBRL(totalRevenue / (data.length || 1))}
          </span>
        </div>
      </div>

      {/* Interactive Bar Chart Area */}
      <div className="space-y-2 pt-2">
        <div className="h-56 w-full flex items-end justify-between gap-2 sm:gap-4 px-2 pt-8 relative">
          {/* Subtle Horizontal Guide Lines */}
          <div className="absolute inset-x-0 top-8 border-b border-zinc-800/40 border-dashed" />
          <div className="absolute inset-x-0 top-1/2 border-b border-zinc-800/40 border-dashed" />
          <div className="absolute inset-x-0 bottom-0 border-b border-zinc-800" />

          {data.map((item, index) => {
            const heightPct = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.periodKey}
                className="flex-1 flex flex-col items-center h-full justify-end relative group cursor-pointer z-10"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 bg-zinc-950 border border-[#c9a44c]/60 rounded-xl p-2.5 shadow-2xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] text-zinc-400 font-medium text-center">
                      {item.fullLabel}
                    </div>
                    <div className="text-xs font-black text-[#e3c56c] text-center">
                      {formatCurrencyBRL(item.revenue)}
                    </div>
                    <div className="text-[10px] text-zinc-300 text-center font-bold">
                      {item.salesCount} {item.salesCount === 1 ? 'moto vendida' : 'motos vendidas'}
                    </div>
                  </div>
                )}

                {/* Bar Value on Top */}
                {item.revenue > 0 && (
                  <span
                    className={`text-[10px] font-bold mb-1 transition-all ${
                      isHovered ? 'text-[#e3c56c]' : 'text-zinc-400'
                    }`}
                  >
                    {formatCompactCurrencyBRL(item.revenue)}
                  </span>
                )}

                {/* Animated Gradient Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[44px] rounded-t-xl transition-all duration-300 relative overflow-hidden ${
                    isHovered
                      ? 'bg-gradient-to-t from-[#c9a44c] via-[#e3c56c] to-amber-300 shadow-[0_0_20px_rgba(201,164,76,0.3)]'
                      : item.revenue > 0
                        ? 'bg-gradient-to-t from-zinc-800 via-zinc-700 to-zinc-500'
                        : 'bg-zinc-900/60'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* X-Axis Month Labels */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 pt-2 text-center">
          {data.map((item) => (
            <div key={item.periodKey} className="flex-1">
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

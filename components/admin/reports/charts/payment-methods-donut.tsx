'use client';

import React from 'react';
import { formatCurrencyBRL } from '@/lib/reports/formatters';

interface PaymentDistributionItem {
  method: string;
  label: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

interface PaymentMethodsDonutProps {
  items: PaymentDistributionItem[];
}

const COLORS = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-zinc-500',
];

export function PaymentMethodsDonut({ items }: PaymentMethodsDonutProps) {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-zinc-500 font-medium">
        Nenhuma forma de pagamento registrada no período.
      </div>
    );
  }

  const totalAmount = items.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div className="space-y-5">
      {/* Segmented Progress Bar */}
      <div className="w-full h-4 rounded-xl bg-zinc-900 overflow-hidden flex border border-zinc-800/80 p-0.5 gap-0.5">
        {items.map((item, idx) => {
          const color = COLORS[idx % COLORS.length];
          const pct = Math.max(1, item.percentage);
          return (
            <div
              key={item.method}
              style={{ width: `${pct}%` }}
              title={`${item.label}: ${item.percentage.toFixed(1)}%`}
              className={`h-full rounded-lg ${color} transition-all duration-500 hover:opacity-80`}
            />
          );
        })}
      </div>

      {/* Legend List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {items.map((item, idx) => {
          const color = COLORS[idx % COLORS.length];
          return (
            <div
              key={item.method}
              className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/50"
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full ${color} shrink-0`} />
                <div>
                  <span className="text-xs font-bold text-white block">{item.label}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {item.count} {item.count === 1 ? 'venda' : 'vendas'} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <span className="text-xs font-black text-zinc-200">
                {formatCurrencyBRL(item.totalAmount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

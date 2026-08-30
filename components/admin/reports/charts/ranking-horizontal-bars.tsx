'use client';

import React from 'react';
import { formatCurrencyBRL } from '@/lib/reports/formatters';

interface RankingItem {
  brand: string;
  count: number;
  totalRevenue: number;
  percentage: number;
}

interface RankingHorizontalBarsProps {
  items: RankingItem[];
}

export function RankingHorizontalBars({ items }: RankingHorizontalBarsProps) {
  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-zinc-500 font-medium">
        Nenhuma venda registrada para compor o ranking no período.
      </div>
    );
  }

  const maxRevenue = Math.max(...items.map((i) => i.totalRevenue), 1);

  return (
    <div className="space-y-3.5">
      {items.slice(0, 6).map((item, idx) => {
        const widthPct = Math.max(5, Math.round((item.totalRevenue / maxRevenue) * 100));

        return (
          <div key={item.brand} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-[#c9a44c]">
                  {idx + 1}
                </span>
                <span className="text-white font-bold">{item.brand}</span>
                <span className="text-[11px] text-zinc-400 font-normal">
                  ({item.count} {item.count === 1 ? 'moto' : 'motos'})
                </span>
              </div>
              <span className="text-white font-black">{formatCurrencyBRL(item.totalRevenue)}</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/60 relative">
              <div
                style={{ width: `${widthPct}%` }}
                className="h-full rounded-full bg-gradient-to-r from-[#c9a44c] to-[#e3c56c] transition-all duration-500"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

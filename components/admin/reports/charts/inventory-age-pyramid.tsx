'use client';

import React from 'react';

interface AgeDistribution {
  under30Days: number;
  between31And60Days: number;
  between61And90Days: number;
  over90Days: number;
}

interface InventoryAgePyramidProps {
  distribution: AgeDistribution;
  totalActive: number;
}

export function InventoryAgePyramid({ distribution, totalActive }: InventoryAgePyramidProps) {
  const tiers = [
    {
      label: '0 a 30 dias (Giro Rápido)',
      count: distribution.under30Days,
      color: 'from-emerald-500 to-teal-400',
      badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Veículos recém-chegados com alto interesse inicial.',
    },
    {
      label: '31 a 60 dias (Estoque Regular)',
      count: distribution.between31And60Days,
      color: 'from-sky-500 to-blue-400',
      badgeClass: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      description: 'Tempo médio de negociação e atendimento normal.',
    },
    {
      label: '61 a 90 dias (Atenção Comercial)',
      count: distribution.between61And90Days,
      color: 'from-amber-500 to-orange-400',
      badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Requer intensificar divulgação e avaliar contrapropostas.',
    },
    {
      label: 'Mais de 90 dias (Estoque Crítico)',
      count: distribution.over90Days,
      color: 'from-rose-500 to-red-400',
      badgeClass: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
      description: 'Capital imobilizado. Recomendado reajuste de preço ou promoção.',
    },
  ];

  const maxCount = Math.max(...tiers.map((t) => t.count), 1);

  return (
    <div className="space-y-4">
      {tiers.map((tier) => {
        const percentage = totalActive > 0 ? (tier.count / totalActive) * 100 : 0;
        const widthPct = Math.max(8, Math.round((tier.count / maxCount) * 100));

        return (
          <div key={tier.label} className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-white font-bold">{tier.label}</span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tier.badgeClass}`}>
                  {percentage.toFixed(0)}% do pátio
                </span>
                <span className="text-white font-black text-sm">
                  {tier.count} {tier.count === 1 ? 'moto' : 'motos'}
                </span>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/80 p-0.5">
              <div
                style={{ width: `${widthPct}%` }}
                className={`h-full rounded-full bg-gradient-to-r ${tier.color} transition-all duration-500`}
              />
            </div>

            <p className="text-[11px] text-zinc-500 font-medium">{tier.description}</p>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import React from 'react';
import { CreditCard, Tag, PieChart, BarChart3, ArrowRight } from 'lucide-react';
import { PaymentMethodShare, BrandShare } from '@/lib/queries/dashboard';

interface PaymentBrandsBreakdownProps {
  paymentDistribution: PaymentMethodShare[];
  topBrands: BrandShare[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function PaymentBrandsBreakdown({
  paymentDistribution,
  topBrands,
}: PaymentBrandsBreakdownProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Distribuição por Forma de Pagamento */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#e3c56c]" />
            <h3 className="font-bold text-sm text-white">Formas de Pagamento</h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-medium">Divisão do Caixa</span>
        </div>

        {paymentDistribution.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-zinc-500">
            Nenhuma venda registrada ainda.
          </div>
        ) : (
          <div className="space-y-3.5">
            {paymentDistribution.map((item) => (
              <div key={item.method} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-zinc-200">{item.label}</span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      ({item.count} {item.count === 1 ? 'venda' : 'vendas'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      {formatCurrency(item.revenue)}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-400 min-w-[32px] text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, item.percentage)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Ranking de Marcas Mais Vendidas */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#e3c56c]" />
            <h3 className="font-bold text-sm text-white">Marcas Campeãs de Giro</h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-medium">Preferência dos Clientes</span>
        </div>

        {topBrands.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-xs text-zinc-500">
            Nenhuma marca registrada em vendas.
          </div>
        ) : (
          <div className="space-y-3">
            {topBrands.slice(0, 5).map((brand, index) => {
              const medalColors = ['text-amber-400', 'text-zinc-300', 'text-amber-700'];
              const medalColor = medalColors[index] || 'text-zinc-500';

              return (
                <div
                  key={brand.brand}
                  className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-black text-xs min-w-[16px] text-center ${medalColor}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <span className="font-extrabold text-sm text-white block">{brand.brand}</span>
                      <span className="text-[11px] text-zinc-400">
                        {brand.count} {brand.count === 1 ? 'moto negociada' : 'motos negociadas'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-bold text-zinc-200 block font-mono">
                      {formatCurrency(brand.revenue)}
                    </span>
                    <span className="text-[10px] font-bold text-[#e3c56c] bg-[#c9a44c]/10 px-1.5 py-0.5 rounded border border-[#c9a44c]/20">
                      {brand.percentage}% do total
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

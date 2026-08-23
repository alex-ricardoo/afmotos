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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Geral Vendido */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#c9a44c]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Volume Total
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
            {formatCurrency(metrics.totalSalesValue)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Faturamento acumulado em vendas</p>
        </div>
      </div>

      {/* Vendas no Mês Atual */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#c9a44c]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Em {capitalizedMonth}
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
            {formatCurrency(metrics.monthSalesValue)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Faturamento no mês vigente</p>
        </div>
      </div>

      {/* Qtd Vendas Mês */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#c9a44c]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Motos Vendidas ({capitalizedMonth})
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
            {metrics.monthSalesCount} {metrics.monthSalesCount === 1 ? 'moto' : 'motos'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Negócios fechados este mês</p>
        </div>
      </div>

      {/* Total de Vendas Histórico */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-[#c9a44c]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total de Vendas
          </span>
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3">
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
            {metrics.totalSalesCount} {metrics.totalSalesCount === 1 ? 'veículo' : 'veículos'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Total histórico cadastrado</p>
        </div>
      </div>
    </div>
  );
}

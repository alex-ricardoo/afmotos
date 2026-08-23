'use client';

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Bike,
  CheckCircle2,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { DashboardMetrics } from '@/lib/queries/dashboard';

interface DashboardKpisProps {
  metrics: DashboardMetrics;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function DashboardKpis({ metrics }: DashboardKpisProps) {
  const isPositiveGrowth = metrics.revenueGrowthPct >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Faturamento do Mês Vigente */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 hover:border-[#c9a44c]/40 transition-all rounded-3xl p-5 shadow-sm group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-70" />
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Faturamento (Mês)
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center border border-[#c9a44c]/30 shadow-xs">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-black tracking-tight text-white group-hover:text-[#e3c56c] transition-colors">
            {formatCurrency(metrics.monthRevenue)}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className={`inline-flex items-center text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                isPositiveGrowth
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isPositiveGrowth ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5" />
              )}
              {isPositiveGrowth ? `+${metrics.revenueGrowthPct}%` : `${metrics.revenueGrowthPct}%`}
            </span>
            <span className="truncate">vs mês anterior</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{metrics.monthSalesCount} motos fechadas</span>
          <span className="font-semibold text-zinc-300">
            Total: {formatCurrency(metrics.totalRevenue)}
          </span>
        </div>
      </div>

      {/* 2. Capital em Estoque Ativo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 hover:border-sky-500/40 transition-all rounded-3xl p-5 shadow-sm group">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Estoque no Pátio
          </span>
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-xs">
            <Bike className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-black tracking-tight text-white group-hover:text-sky-400 transition-colors">
            {metrics.availableStockCount}{' '}
            <span className="text-sm font-medium text-zinc-400">
              {metrics.availableStockCount === 1 ? 'moto pronta' : 'motos prontas'}
            </span>
          </div>
          <div className="text-xs text-zinc-400">
            Valor em Pátio:{' '}
            <span className="font-bold text-sky-400">
              {formatCurrency(metrics.availableStockValue)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
          <span>Giro ativo</span>
          <span className="font-semibold text-zinc-300">
            {metrics.totalMotorcyclesCount} cadastradas no total
          </span>
        </div>
      </div>

      {/* 3. Ticket Médio por Venda */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 hover:border-emerald-500/40 transition-all rounded-3xl p-5 shadow-sm group">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Ticket Médio
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors">
            {formatCurrency(metrics.avgTicket)}
          </div>
          <div className="text-xs text-zinc-400">Média por veículo negociado</div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{metrics.totalSalesCount} negócios concluídos</span>
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> 100% formalizado
          </span>
        </div>
      </div>

      {/* 4. Leads & Taxa de Fechamento */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/80 hover:border-amber-500/40 transition-all rounded-3xl p-5 shadow-sm group">
        <div className="flex items-center justify-between pb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Propostas & Leads
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
            {metrics.newLeadsCount}{' '}
            <span className="text-sm font-medium text-zinc-400">
              {metrics.newLeadsCount === 1 ? 'novo contato' : 'novos contatos'}
            </span>
          </div>
          <div className="text-xs text-zinc-400">
            Taxa de Conversão:{' '}
            <span className="font-bold text-amber-400">{metrics.conversionRatePct}%</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
          <span>{metrics.totalLeadsCount} leads recebidos</span>
          <span className="font-semibold text-[#e3c56c]">WhatsApp & Site</span>
        </div>
      </div>
    </div>
  );
}

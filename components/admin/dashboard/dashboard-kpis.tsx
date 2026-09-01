'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  Bike,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet,
  ArrowRight,
  ShieldCheck,
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
  const isNetPositive = metrics.netOperationalResult >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {/* 1. Faturamento do Mês Vigente */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 hover:border-[#c9a44c]/60 transition-all duration-300 rounded-3xl p-5 shadow-lg shadow-black/20 group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a44c] animate-pulse" />
            Faturamento (Mês)
          </span>
          <div className="w-8 h-8 rounded-xl bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center border border-[#c9a44c]/30 shadow-xs group-hover:scale-110 transition-transform">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-[#e3c56c] transition-colors font-mono">
            {formatCurrency(metrics.monthRevenue)}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 pt-0.5">
            <span
              className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                isPositiveGrowth
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isPositiveGrowth ? (
                <ArrowUpRight className="w-3 h-3 mr-0.5 shrink-0" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-0.5 shrink-0" />
              )}
              {isPositiveGrowth ? `+${metrics.revenueGrowthPct}%` : `${metrics.revenueGrowthPct}%`}
            </span>
            <span className="text-[11px] text-zinc-400 truncate">vs mês anterior</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="font-medium text-zinc-300">
            {metrics.monthSalesCount} {metrics.monthSalesCount === 1 ? 'moto vendida' : 'motos vendidas'}
          </span>
          <span className="text-zinc-500 text-[10px]">
            Acumulado: <strong className="text-zinc-300">{formatCurrency(metrics.totalRevenue)}</strong>
          </span>
        </div>
      </div>

      {/* 2. Capital em Estoque Ativo */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 hover:border-sky-500/60 transition-all duration-300 rounded-3xl p-5 shadow-lg shadow-black/20 group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-60" />
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Estoque no Pátio
          </span>
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30 shadow-xs group-hover:scale-110 transition-transform">
            <Bike className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-sky-400 transition-colors font-mono">
            {metrics.availableStockCount}{' '}
            <span className="text-sm font-medium text-zinc-400 font-sans">
              {metrics.availableStockCount === 1 ? 'moto pronta' : 'motos prontas'}
            </span>
          </div>
          <div className="text-xs text-zinc-400 pt-0.5">
            Capital em Pátio:{' '}
            <span className="font-bold text-sky-400 font-mono">
              {formatCurrency(metrics.availableStockValue)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <Link
            href="/admin/motos"
            className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Ver pátio completo</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-zinc-500 text-[10px]">
            {metrics.totalMotorcyclesCount} no catálogo
          </span>
        </div>
      </div>

      {/* 3. Propostas & Oportunidades CRM */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 hover:border-amber-500/60 transition-all duration-300 rounded-3xl p-5 shadow-lg shadow-black/20 group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Propostas & Leads
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-xs group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-black tracking-tight text-white group-hover:text-amber-400 transition-colors font-mono">
            {metrics.newLeadsCount}{' '}
            <span className="text-sm font-medium text-zinc-400 font-sans">
              {metrics.newLeadsCount === 1 ? 'novo contato' : 'novos contatos'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 pt-0.5">
            <span className="text-xs text-zinc-400">
              Taxa de Conversão:{' '}
              <strong className="text-amber-400 font-mono">{metrics.conversionRatePct}%</strong>
            </span>
            {metrics.todayLeadsCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                +{metrics.todayLeadsCount} hoje
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <Link
            href="/admin/propostas"
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Atender propostas</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-zinc-500 text-[10px]">
            {metrics.totalLeadsCount} total recebidos
          </span>
        </div>
      </div>

      {/* 4. Resultado Operacional / Despesas */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 hover:border-emerald-500/60 transition-all duration-300 rounded-3xl p-5 shadow-lg shadow-black/20 group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Resultado Líquido (Mês)
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-xs group-hover:scale-110 transition-transform">
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div className="space-y-1">
          <div
            className={`text-2xl sm:text-3xl font-black tracking-tight transition-colors font-mono ${
              isNetPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(metrics.netOperationalResult)}
          </div>
          <div className="text-xs text-zinc-400 pt-0.5">
            Gastos pagos:{' '}
            <span className="font-bold text-rose-400/90 font-mono">
              {formatCurrency(metrics.monthExpenses)}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
          <Link
            href="/admin/gastos"
            className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Ver controle financeiro</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
          <span className="text-zinc-500 text-[10px]">
            Ticket Médio: <strong className="text-zinc-300">{formatCurrency(metrics.avgTicket)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

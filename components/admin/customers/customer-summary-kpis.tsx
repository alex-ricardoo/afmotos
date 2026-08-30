import React from 'react';
import { Users, UserCheck, ShoppingBag, Sparkles, UserPlus } from 'lucide-react';
import { CustomerMetrics } from '@/lib/queries/customers';

interface CustomerSummaryKpisProps {
  metrics: CustomerMetrics;
}

export function CustomerSummaryKpis({ metrics }: CustomerSummaryKpisProps) {
  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total da Carteira */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-[#c9a44c]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Carteira Total
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Users className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-black tracking-tight text-white font-mono">
            {metrics.total}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Clientes registrados no CRM</p>
        </div>
      </div>

      {/* 2. Cadastros Ativos */}
      <div className="bg-zinc-950/70 border border-emerald-500/25 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-400/90 uppercase tracking-wider">
            Clientes Ativos
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-black tracking-tight text-emerald-400 font-mono">
            {metrics.active}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Disponíveis para contato comercial</p>
        </div>
      </div>

      {/* 3. Clientes Compradores */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-[#c9a44c]/40 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#e3c56c] uppercase tracking-wider">
            Compradores
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 flex items-center justify-center text-[#e3c56c]">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-black tracking-tight text-white font-mono">
            {metrics.buyers}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Com pelo menos 1 moto comprada</p>
        </div>
      </div>

      {/* 4. Novos no Mês Vigente */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4.5 shadow-xs relative overflow-hidden group hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Em {capitalizedMonth}
          </span>
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <UserPlus className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-black tracking-tight text-white font-mono">
            {metrics.newThisMonth}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">Novos cadastros este mês</p>
        </div>
      </div>
    </div>
  );
}

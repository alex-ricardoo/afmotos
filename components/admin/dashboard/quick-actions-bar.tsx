'use client';

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Bike, Scale, MessageSquare, Receipt, ArrowRight } from 'lucide-react';

export function QuickActionsBar() {
  const actions = [
    {
      title: 'Registrar Nova Venda',
      subtitle: 'Emitir recibo e abater estoque',
      href: '/admin/vendas/nova',
      icon: PlusCircle,
      iconBg: 'bg-[#c9a44c]/20 text-[#e3c56c] border-[#c9a44c]/40',
      badge: 'Principal',
      highlight: true,
    },
    {
      title: 'Cadastrar Moto',
      subtitle: 'Adicionar moto ao estoque',
      href: '/admin/motos/nova',
      icon: Bike,
      iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      badge: 'Estoque',
    },
    {
      title: 'Consultar Tabela FIPE',
      subtitle: 'Simulador de compra & margem',
      href: '/admin/fipe',
      icon: Scale,
      iconBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      badge: 'Avaliação',
    },
    {
      title: 'Ver Propostas & Leads',
      subtitle: 'Atendimento e clientes',
      href: '/admin/propostas',
      icon: MessageSquare,
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badge: 'CRM',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-1.5 h-3.5 rounded-full bg-[#c9a44c]" />
          <span>Ações Rápidas de Operação</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => (
          <Link
            key={act.title}
            href={act.href}
            className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
              act.highlight
                ? 'bg-gradient-to-r from-[#c9a44c]/15 via-zinc-900 to-zinc-950 border-[#c9a44c]/40 hover:border-[#c9a44c] shadow-[0_0_20px_rgba(201,164,76,0.1)]'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${act.iconBg}`}
              >
                <act.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white group-hover:text-[#e3c56c] transition-colors truncate">
                    {act.title}
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 truncate">{act.subtitle}</p>
              </div>
            </div>

            <div className="w-7 h-7 rounded-lg bg-zinc-900/80 flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0 ml-2">
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

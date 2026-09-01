'use client';

import React from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Bike,
  Scale,
  MessageSquare,
  FileSearch,
  Users,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

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
      subtitle: 'Entrada de veículo no estoque',
      href: '/admin/motos/nova',
      icon: Bike,
      iconBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      badge: 'Estoque',
    },
    {
      title: 'Consultar Placa',
      subtitle: 'Laudo de procedência e débitos',
      href: '/admin/consulta-placa',
      icon: FileSearch,
      iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badge: 'Laudo',
    },
    {
      title: 'Propostas & CRM',
      subtitle: 'Novos contatos e WhatsApp',
      href: '/admin/propostas',
      icon: MessageSquare,
      iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      badge: 'Leads',
    },
    {
      title: 'Novo Cliente',
      subtitle: 'Cadastro na base unificada',
      href: '/admin/clientes',
      icon: Users,
      iconBg: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
      badge: 'Clientes',
    },
    {
      title: 'Tabela FIPE',
      subtitle: 'Simulador de compra & margem',
      href: '/admin/fipe',
      icon: Scale,
      iconBg: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
      badge: 'Avaliação',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-3.5 rounded-full bg-[#c9a44c]" />
          <span>Atalhos Rápidos de Operação</span>
        </h2>
        <span className="text-[11px] text-zinc-500 hidden sm:inline">1 toque para abrir</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {actions.map((act) => (
          <Link
            key={act.title}
            href={act.href}
            className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 active:scale-[0.98] ${
              act.highlight
                ? 'bg-gradient-to-b from-[#c9a44c]/15 via-zinc-900/90 to-zinc-950 border-[#c9a44c]/40 hover:border-[#c9a44c] shadow-[0_0_20px_rgba(201,164,76,0.12)]'
                : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-110 ${act.iconBg}`}
              >
                <act.icon className="w-4.5 h-4.5" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-zinc-200">
                {act.badge}
              </span>
            </div>

            <div>
              <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-[#e3c56c] transition-colors leading-snug truncate">
                {act.title}
              </h3>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-tight">{act.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

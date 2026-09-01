'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  FileSearch,
  Sparkles,
  Store,
  Calendar,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';

export function DashboardHeader() {
  const [greeting, setGreeting] = useState('Painel de Gestão');
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 5 && hour < 12) {
      setGreeting('Bom dia!');
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Boa tarde!');
    } else {
      setGreeting('Boa noite!');
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    const dateStr = now.toLocaleDateString('pt-BR', options);
    // Capitalize first letter
    setFormattedDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-[#141419] to-zinc-950 border border-zinc-800/80 rounded-3xl p-5 sm:p-7 shadow-xl shadow-black/20">
      {/* Decorative Gold Accent Light */}
      <div className="absolute top-0 right-1/4 w-72 h-32 bg-[#c9a44c]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-48 h-20 bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Greeting & Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Loja Aberta • Sistema Ativo</span>
            </span>
            {formattedDate && (
              <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {formattedDate}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {greeting} <span className="text-[#e3c56c]">Visão Executiva</span>
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
            Resumo em tempo real de vendas, giro do estoque no pátio e atendimento de clientes.
          </p>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
          <Link
            href="/admin/consulta-placa"
            className={buttonVariants({
              variant: 'outline',
              size: 'default',
              className:
                'h-10 px-4 rounded-xl text-xs sm:text-sm font-bold border-zinc-700/80 bg-zinc-900/80 text-zinc-200 hover:bg-zinc-800 hover:text-white cursor-pointer shadow-xs transition-all flex items-center gap-2',
            })}
          >
            <FileSearch className="w-4 h-4 text-emerald-400" />
            <span>Consultar Placa</span>
          </Link>

          <Link
            href="/admin/vendas/nova"
            className={buttonVariants({
              variant: 'default',
              size: 'default',
              className:
                'h-10 px-4.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-[#c9a44c] via-[#e3c56c] to-[#c9a44c] text-black hover:opacity-95 shadow-md shadow-[#c9a44c]/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2',
            })}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nova Venda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

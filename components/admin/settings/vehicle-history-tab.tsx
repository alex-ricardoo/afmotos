'use client';

import React from 'react';
import Link from 'next/link';
import { FileSearch, ArrowRight, Sparkles, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VehicleHistoryTab() {
  return (
    <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-5 max-w-xl mx-auto my-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.15)]">
        <Sliders className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">
          Configurações Transferidas para o Menu Principal
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          As opções de precificação, margem de lucro, mensagens e landing page do Histórico Veicular
          agora contam com uma tela exclusiva organizada em etapas no menu lateral.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/admin/historico-veicular/configuracoes"
          className="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-amber-500/20 gap-2 cursor-pointer text-sm transition-all"
        >
          <span>Acessar Configuração & Preço</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  BadgeCheck,
  Zap,
  DollarSign,
  FileCheck2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function VehicleHistoryReasons() {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');

  return (
    <section className="py-10 sm:py-16 bg-[#0D111A] border-t border-[#1F293D] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8 space-y-1.5">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Vantagens da Consulta
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight font-heading">
            Protege quem compra e valoriza quem vende
          </h2>
        </div>

        {/* Interactive Segmented Switcher (Tabs) */}
        <div className="max-w-md mx-auto mb-5 p-1 rounded-2xl bg-[#080B11] border border-[#1F293D] grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('buyer')}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              activeTab === 'buyer'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white',
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Para Compradores</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seller')}
            className={cn(
              'py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              activeTab === 'seller'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white',
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Para Vendedores & Lojas</span>
          </button>
        </div>

        {/* Single Unified Card */}
        <div className="p-5 sm:p-7 rounded-3xl bg-[#131A26] border border-[#1F293D] shadow-xl">
          {activeTab === 'buyer' ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#1F293D]">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Compre Sem Medo de Golpes
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Saiba o passado real do veículo antes de dar sinal ou assinar o recibo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#080B11] border border-[#1F293D] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Roubo & Sinistro</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">
                    Verifique se há queixa policial ativa ou registro de sinistro.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080B11] border border-[#1F293D] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Leilão & Gravame</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">
                    Descubra alienação fiduciária e passagem em leilões.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080B11] border border-[#1F293D] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>IPVA & Multas</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">
                    Identifique débitos estaduais para abater no valor negociado.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-3 border-b border-[#1F293D]">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Valorize Seu Veículo na Venda
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Passe credibilidade imediata ao comprador com um laudo oficial limpo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#080B11] border border-[#1F293D] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Venda Mais Rápido</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">
                    Elimine desconfianças enviando o PDF completo pelo WhatsApp.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080B11] border border-[#1F293D] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Defenda o Preço</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">
                    Comprove que seu veículo não tem restrições nem apontamentos.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#080B11] border border-[#1F293D] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    <span>Laudo Autenticado</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-snug">
                    Documento profissional pronto para anexar ao anúncio.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

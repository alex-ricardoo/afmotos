'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  BadgeCheck,
  DollarSign,
  FileDown,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function VehicleHistoryReasons() {
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');

  return (
    <section className="py-10 sm:py-16 bg-slate-950 border-t border-white/5 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8 space-y-1.5">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            Vantagens da Consulta
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-50 tracking-tight font-heading">
            Protege quem compra e valoriza quem vende
          </h2>
        </div>

        {/* Interactive Segmented Switcher (Tabs with min 44px touch target) */}
        <div className="max-w-md mx-auto mb-5 p-1 rounded-2xl bg-slate-900/90 border border-white/5 grid grid-cols-2 gap-1 shadow-md">
          <button
            type="button"
            id="tab-reasons-buyer"
            onClick={() => setActiveTab('buyer')}
            className={cn(
              'min-h-[44px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
              activeTab === 'buyer'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Para Compradores</span>
          </button>

          <button
            type="button"
            id="tab-reasons-seller"
            onClick={() => setActiveTab('seller')}
            className={cn(
              'min-h-[44px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50',
              activeTab === 'seller'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200',
            )}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Para Vendedores</span>
          </button>
        </div>

        {/* Single Unified Card */}
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 shadow-xl shadow-black/40">
          {activeTab === 'buyer' ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-50">
                    Compre com Segurança e Sem Surpresas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Descubra o histórico real antes de pagar sinal ou assinar qualquer recibo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Roubo & Batidas</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Verifique se há queixa de furto ativa ou histórico grave de colisão.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Leilão & Dívida</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Evite veículos com financiamento em atraso ou passagem em leilão.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400">
                    <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>IPVA & Multas</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Descubra débitos do antigo dono para descontar direto no preço.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-50">
                    Valorize Seu Veículo e Venda Mais Rápido
                  </h3>
                  <p className="text-xs text-slate-400">
                    Passe confiança total ao comprador com o laudo oficial em PDF anexado.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Link2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Área do Cliente Online</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Acesse e compartilhe o laudo com o comprador direto do seu painel.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span>Defenda Seu Preço</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Prove ausência de leilão e débitos para cortar ofertas desonestas.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                    <FileDown className="w-3.5 h-3.5 shrink-0" />
                    <span>PDF Oficial</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-snug">
                    Guarde o laudo para comprovar a procedência no fechamento do contrato.
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


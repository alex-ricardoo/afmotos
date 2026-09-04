'use client';

import React from 'react';
import {
  Search,
  MessageCircle,
  FileCheck,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useVehicleHistory } from './vehicle-history-context';

const STEPS = [
  {
    num: '01',
    stepLabel: 'Passo 1',
    badge: '30 segundos',
    title: 'Digite a Placa no Site',
    desc: 'Informe a placa do veículo no início da página. O sistema valida os dados e você clica para abrir o WhatsApp oficial.',
    icon: Search,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/25',
    pill: 'Sem cadastro longo',
  },
  {
    num: '02',
    stepLabel: 'Passo 2',
    badge: 'Suporte Humano',
    title: 'Atendimento & Pagamento',
    desc: 'Nossa equipe atende você no WhatsApp com total suporte. Pague com facilidade e segurança via Pix ou Cartão no link.',
    icon: MessageCircle,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/25',
    pill: 'Pix ou Cartão seguro',
  },
  {
    num: '03',
    stepLabel: 'Passo 3',
    badge: 'Em até 5 minutos',
    title: 'Laudo Oficial + Link Seguro',
    desc: 'O link interativo e o arquivo em PDF chegam na hora na sua conversa para você salvar, imprimir ou apresentar ao comprador.',
    icon: FileCheck,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/25',
    pill: 'PDF pronto p/ negociação',
  },
];

interface VehicleHistoryHowItWorksProps {
  siteName?: string;
}

export function VehicleHistoryHowItWorks({ siteName = 'AF Motos' }: VehicleHistoryHowItWorksProps = {}) {
  const { scrollToSection } = useVehicleHistory();

  return (
    <section className="py-12 sm:py-20 bg-[#080B11] border-t border-[#1F293D] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simples, Rápido & Sem Burocracia</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            Como funciona em 3 passos
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Consulte qualquer veículo no Brasil e receba o diagnóstico completo diretamente no seu celular em minutos.
          </p>
        </div>

        {/* Steps Grid with Timeline Flow */}
        <div className="relative">
          {/* Subtle Desktop Connector Line */}
          <div className="hidden md:block absolute top-1/2 left-12 right-12 h-0.5 bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-amber-500/20 -translate-y-8 -z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-10">
            {STEPS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-[#131A26] to-[#0E1420] border border-[#1F293D] hover:border-amber-500/40 shadow-xl shadow-black/60 transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Card Header: Step number badge + Context Icon */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black font-mono text-sm flex items-center justify-center shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30">
                        {item.num}
                      </span>
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        {item.stepLabel}
                      </span>
                    </div>

                    <div className={`w-9 h-9 rounded-xl ${item.iconBg} flex items-center justify-center border transition-transform duration-300 group-hover:scale-110`}>
                      <Icon className={`w-4 h-4 ${item.iconColor}`} />
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  {/* Card Footer Pill */}
                  <div className="mt-4 pt-3 border-t border-[#1F293D]/80 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {item.pill}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800/80 text-zinc-400 border border-slate-700/60">
                      {item.badge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value Proposition Callout (Padded to avoid floating WhatsApp clash on mobile) */}
        <div className="relative p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#101724] to-[#101724] border border-amber-500/30 shadow-xl pr-14 sm:pr-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <TrendingUp className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-extrabold text-white">
                  Diferencial na Compra e Venda de Veículos
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                  Ter o laudo oficial em PDF e o link interativo guardados <strong className="text-amber-300">comprova procedência</strong>, afasta compradores desconfiados e <strong className="text-white">valoriza seu veículo</strong> para fechar negócio pelo preço justo!
                </p>
              </div>
            </div>

            <button
              type="button"
              id="btn-howitworks-consultar"
              onClick={() => scrollToSection('consulta-placa')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0 active:scale-95"
            >
              <span>Consultar Placa</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

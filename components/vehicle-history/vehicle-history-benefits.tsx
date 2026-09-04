import React from 'react';
import {
  Gavel,
  CreditCard,
  Scale,
  DollarSign,
  Users,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';

const PILLARS = [
  {
    title: 'Passagem por Leilão ou Batida',
    description: 'Descubra se foi recuperado por seguradora ou leilão, o que derruba até 40% do valor.',
    icon: Gavel,
    badge: 'Até -40% no Valor',
    theme: {
      border: 'hover:border-red-500/50',
      badge: 'bg-red-500/15 text-red-300 border-red-500/30',
      iconBox: 'bg-gradient-to-br from-red-500/20 to-red-600/5 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      glow: 'from-red-500/10 via-transparent to-transparent',
    },
  },
  {
    title: 'Dívida no Banco (Alienação)',
    description: 'Verifique se o veículo ainda está financiado por terceiro e se a transferência está travada.',
    icon: CreditCard,
    badge: 'Trava Transferência',
    theme: {
      border: 'hover:border-amber-500/50',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      iconBox: 'bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      glow: 'from-amber-500/10 via-transparent to-transparent',
    },
  },
  {
    title: 'Bloqueio na Justiça (Penhora)',
    description: 'Evite apreensão em blitz por ordens judiciais de busca, penhora ou processos do antigo dono.',
    icon: Scale,
    badge: 'Risco de Perda Total',
    theme: {
      border: 'hover:border-purple-500/50',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      iconBox: 'bg-gradient-to-br from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]',
      glow: 'from-purple-500/10 via-transparent to-transparent',
    },
  },
  {
    title: 'Multas e Impostos Atrasados',
    description: 'Saiba o valor exato de IPVA e multas no Detran para abater direto na negociação.',
    icon: DollarSign,
    badge: 'Desconto Imediato',
    theme: {
      border: 'hover:border-emerald-500/50',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      iconBox: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      glow: 'from-emerald-500/10 via-transparent to-transparent',
    },
  },
  {
    title: 'Dono Anterior & Frotas',
    description: 'Veja se pertenceu a locadoras de uso severo ou se teve trocas suspeitas de proprietários.',
    icon: Users,
    badge: 'Desgaste e Uso Real',
    theme: {
      border: 'hover:border-blue-500/50',
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      iconBox: 'bg-gradient-to-br from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
      glow: 'from-blue-500/10 via-transparent to-transparent',
    },
  },
  {
    title: 'Preço Justo FIPE',
    description: 'Compare com a cotação oficial atualizada para negociar com firmeza e não pagar a mais.',
    icon: TrendingDown,
    badge: 'Preço de Tabela',
    theme: {
      border: 'hover:border-amber-400/50',
      badge: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
      iconBox: 'bg-gradient-to-br from-amber-400/20 to-amber-500/5 text-amber-300 border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]',
      glow: 'from-amber-400/10 via-transparent to-transparent',
    },
  },
];

export function VehicleHistoryBenefits() {
  return (
    <section className="py-12 sm:py-20 bg-[#080B11] relative overflow-hidden">
      {/* Subtle Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-14 space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-black tracking-wide uppercase shadow-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Proteção Completa</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading leading-tight">
            O que você descobre antes de transferir o dinheiro
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto font-medium">
            Identifique armadilhas e prejuízos escondidos com dados diretos das bases oficiais do governo e trânsito.
          </p>
        </div>

        {/* 6 Visual Pillars Grid (Optimized 2-col on tablet/mobile, 3-col on desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className={`group relative overflow-hidden p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-[#0F1420]/80 border border-[#1E2638] ${pillar.theme.border} transition-all duration-300 backdrop-blur-xl shadow-lg shadow-black/40 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between`}
              >
                {/* Top Corner Glow Accent */}
                <div
                  className={`absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-bl ${pillar.theme.glow} rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
                />

                <div className="relative z-10 space-y-3.5">
                  {/* Top Bar: Icon + Pill Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${pillar.theme.iconBox}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${pillar.theme.badge}`}
                    >
                      {pillar.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors tracking-tight">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}



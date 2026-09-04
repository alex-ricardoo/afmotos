import React from 'react';
import { ShieldCheck, Database, UserCheck, Clock } from 'lucide-react';

interface VehicleHistoryStatsProps {
  siteShortName?: string;
}

export function VehicleHistoryStats({ siteShortName = 'Loja' }: VehicleHistoryStatsProps = {}) {
  const metrics = [
    {
      value: '100%',
      highlight: 'Nacional',
      label: 'Motos, carros e caminhões de todo o Brasil',
      icon: ShieldCheck,
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'Senatran & Detran',
    },
    {
      value: 'Bases',
      highlight: 'Oficiais',
      label: 'Dados integrados do Detran, Renajud e Leilões',
      icon: Database,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'Origem Segura',
    },
    {
      value: 'Suporte',
      highlight: 'Humano',
      label: 'Especialista real conferindo sua placa no WhatsApp',
      icon: UserCheck,
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badge: 'Sem Robôs',
    },
    {
      value: 'Em Poucos',
      highlight: 'Minutos',
      label: 'Link online interativo e PDF enviados na conversa',
      icon: Clock,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badge: 'Envio Ágil',
    },
  ];

  return (
    <section className="bg-[#0A0E17] border-y border-[#1F293D] py-5 sm:py-7 relative z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile-first 2x2 on mobile, 4-col on desktop, modern cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className="group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl bg-[#111622]/90 border border-[#1F293D] hover:border-amber-500/30 transition-all duration-300 shadow-md shadow-black/40 hover:scale-[1.01]"
              >
                {/* Header with Icon & Pill badge */}
                <div className="flex items-center justify-between gap-1.5 mb-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${metric.iconBg}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#161D2C] text-zinc-300 border border-[#232F46]">
                    {metric.badge}
                  </span>
                </div>

                {/* Main Metric Title */}
                <div>
                  <h3 className="text-base sm:text-xl font-black text-white tracking-tight leading-none flex items-baseline gap-1">
                    <span>{metric.value}</span>
                    <span className="text-amber-400">{metric.highlight}</span>
                  </h3>
                  <p className="text-[11px] sm:text-xs text-zinc-400 mt-1.5 leading-snug font-medium line-clamp-2">
                    {metric.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


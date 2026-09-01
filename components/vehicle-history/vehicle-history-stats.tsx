import React from 'react';
import { ShieldCheck, Database, UserCheck, Zap } from 'lucide-react';

interface VehicleHistoryStatsProps {
  siteShortName?: string;
}

export function VehicleHistoryStats({ siteShortName = 'Loja' }: VehicleHistoryStatsProps = {}) {
  const metrics = [
    {
      value: '100%',
      label: `Motos da ${siteShortName} com Histórico`,
      icon: ShieldCheck,
      color: 'text-amber-400',
    },
    {
      value: '100%',
      label: 'Bases Oficiais Integradas',
      icon: Database,
      color: 'text-emerald-400',
    },
    {
      value: 'Humanizado',
      label: 'Atendimento por Especialistas',
      icon: UserCheck,
      color: 'text-amber-400',
    },
    {
      value: 'Ágil',
      label: 'Envio Direto no WhatsApp',
      icon: Zap,
      color: 'text-emerald-400',
    },
  ];

  return (
    <section className="bg-[#0D111A]/90 border-y border-[#1F293D] backdrop-blur-md relative z-10 py-5 sm:py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#1F293D]">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={idx}
                className={`flex flex-col items-center text-center px-3 ${
                  idx > 0 ? 'pt-4 sm:pt-0' : ''
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white font-mono tracking-tight">
                    {metric.value}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-zinc-400">
                  {metric.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

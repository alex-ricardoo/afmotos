'use client';

import React from 'react';
import { Check, Clock } from 'lucide-react';

interface VehicleConsultationBenefitsProps {
  className?: string;
}

export function VehicleConsultationBenefits({ className = '' }: VehicleConsultationBenefitsProps) {
  const benefits = [
    'Dados cadastrais e características do veículo',
    'Histórico de leilões e sinistros',
    'Restrições judiciais e Renajud',
    'Débitos, multas e IPVA',
    'Acesso ao laudo no seu painel',
    'E muito mais: mais de 30 checagens completas no laudo',
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black tracking-tight text-white">
            O que você recebe no Laudo
          </h3>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            +30 Checagens
          </span>
        </div>

        <ul className="space-y-3" role="list">
          {benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
              </span>
              <span className="leading-snug">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Reassurance note */}
        <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span>Liberação automática no painel assim que confirmado.</span>
        </div>
      </div>
    </div>
  );
}

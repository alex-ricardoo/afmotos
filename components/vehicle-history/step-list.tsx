'use client';

import React from 'react';
import { LucideIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  number: string;
  stepLabel?: string;
  title: string;
  description: string;
  badge?: string;
  pill?: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
}

export interface StepListProps {
  steps: StepItem[];
  className?: string;
}

/**
 * StepList - Componente de Linha do Tempo Vertical Mobile-First
 * 
 * Decisões de UX/UI aplicadas:
 * 1. Fluxo Vertical: Guiagem natural de leitura de cima para baixo no celular, sem necessidade de scroll horizontal ou quebras desajeitadas.
 * 2. Indicadores Circulares Minimalistas: Círculos com borda bronze/dourada escovada (border-amber-500/40 text-amber-400 bg-amber-500/10) que marcam visualmente a cadência do processo.
 * 3. Conector Vertical Sutil: Linha conectora vertical translúcida que amarra a progressão dos passos.
 * 4. Superfície dos Itens: Cards com bg-slate-900/80, borda sutil border-white/5 e sombra elegante shadow-xl shadow-black/40.
 */
export function StepList({ steps, className }: StepListProps) {
  return (
    <div className={cn('relative space-y-4 sm:space-y-6', className)}>
      {/* Linha vertical contínua conectando os passos */}
      <div
        className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-amber-500/30 via-slate-700 to-transparent -z-0"
        aria-hidden="true"
      />

      {steps.map((step, idx) => {
        const Icon = step.icon;
        return (
          <div
            key={idx}
            className="group relative z-10 flex items-start gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-amber-500/30 shadow-xl shadow-black/40 transition-all duration-200"
          >
            {/* Indicador Circular Minimalista com Borda Dourada/Bronze */}
            <div className="shrink-0 flex items-center justify-center">
              <span className="w-11 h-11 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 font-black font-mono text-sm flex items-center justify-center shadow-md shadow-amber-950/40">
                {step.number}
              </span>
            </div>

            {/* Conteúdo Principal do Passo */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-slate-50 tracking-tight leading-snug group-hover:text-amber-400 transition-colors">
                    {step.title}
                  </h3>
                </div>

                {step.badge && (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/5">
                    {step.badge}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {step.description}
              </p>

              {/* Pílula de Confirmação Rápida */}
              {(step.pill || Icon) && (
                <div className="pt-2 flex items-center gap-3 flex-wrap">
                  {step.pill && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{step.pill}</span>
                    </span>
                  )}
                  {Icon && (
                    <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-amber-400/80">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

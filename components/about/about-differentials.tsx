import React from 'react';
import * as LucideIcons from 'lucide-react';
import { StoreDifferential } from '@/types/site-settings';
import { CONSTANTS } from '@/lib/utils/constants';
import { Sparkles } from 'lucide-react';

interface AboutDifferentialsProps {
  differentials: StoreDifferential[];
  siteName?: string;
}

export function AboutDifferentials({ differentials, siteName }: AboutDifferentialsProps) {
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const activeDifferentials = differentials
    .filter((d) => d.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (activeDifferentials.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-zinc-950 py-16 md:py-24 border-t border-zinc-800/80 relative overflow-hidden">
      {/* Glow Sutil de Fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-80 bg-amber-500/5 blur-[140px] pointer-events-none rounded-full" />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Diferenciais Exclusivos</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Por que escolher a {storeName}?
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Aqui sua negociação é levada a sério com padrão de concessionária e atendimento transparente.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {activeDifferentials.map((diff) => {
            // Dynamically get the icon component from Lucide
            const IconComponent = (LucideIcons as any)[diff.icon] || LucideIcons.CheckCircle2;

            return (
              <div
                key={diff.id}
                className="group relative flex flex-col items-center text-center p-7 sm:p-8 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 hover:border-amber-500/40 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1"
              >
                {/* Ícone com Efeito Hover */}
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all duration-300 shadow-md shadow-amber-500/10 mb-5">
                  <IconComponent className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors mb-2.5 font-heading">
                  {diff.title}
                </h3>

                {diff.description && (
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    {diff.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

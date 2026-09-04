import React from 'react';
import Image from 'next/image';
import { StoreImage } from '@/types/site-settings';
import { CONSTANTS } from '@/lib/utils/constants';
import { Sparkles, ShieldCheck, HeartHandshake, Bike, Award, CheckCircle2 } from 'lucide-react';

interface AboutHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  additionalText?: string;
  storeImages?: StoreImage[];
  siteName?: string;
}

export function AboutHero({
  title,
  subtitle,
  description,
  additionalText,
  storeImages = [],
  siteName,
}: AboutHeroProps) {
  const store = siteName || CONSTANTS.STORE_NAME;
  const displayTitle = title || `Sobre a ${store}`;
  const displaySubtitle =
    subtitle || `Tradição, transparência e paixão por duas rodas em Cabo de Santo Agostinho e região.`;

  const activeImages = storeImages.filter((img) => img.isActive && img.url);
  const hasImages = activeImages.length > 0;
  const isSingleImage = activeImages.length === 1;

  return (
    <div className="w-full bg-zinc-950 text-zinc-100">
      {/* Hero Header com Efeito Dark Luxury */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/80 to-zinc-950 pt-16 pb-14 sm:pt-20 sm:pb-16 border-b border-zinc-800/80">
        {/* Glow Dourado de Fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-amber-500/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Nossa História & Compromisso</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white font-heading">
            {displayTitle}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-zinc-300 leading-relaxed max-w-2xl mx-auto font-normal">
            {displaySubtitle}
          </p>

          {/* Pilares Rápidos de Confiança */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs font-semibold text-zinc-300">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Laudo & Procedência 100% Garantidos</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
              <HeartHandshake className="w-4 h-4 text-amber-400" />
              <span>Negociação Segura e Sem Golpe</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 shadow-sm">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Garantia de 90 Dias</span>
            </span>
          </div>
        </div>
      </section>

      {/* Galeria de Fotos da Loja (Se existirem imagens configuradas) */}
      {hasImages && (
        <section className="container mx-auto px-4 sm:px-6 py-10 md:py-14 max-w-6xl">
          {isSingleImage ? (
            <div className="relative w-full aspect-[21/9] sm:aspect-[21/8] rounded-3xl overflow-hidden border border-zinc-800/80 shadow-2xl shadow-black/80 group">
              <Image
                src={activeImages[0].url!}
                alt={activeImages[0].alt || `${displayTitle} - Nossa Loja`}
                fill
                priority
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent flex items-end p-6 sm:p-8">
                <span className="text-sm font-semibold text-zinc-200 bg-zinc-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-zinc-700/60">
                  {activeImages[0].alt || `Conheça a ${store}`}
                </span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-3 sm:gap-4 h-[42vh] md:h-[58vh]">
              {/* Imagem Principal Maior */}
              <div className="col-span-2 row-span-2 relative rounded-3xl overflow-hidden border border-zinc-800/80 group shadow-xl">
                <Image
                  src={activeImages[0].url!}
                  alt={activeImages[0].alt || displayTitle}
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent flex items-end p-6">
                  <div className="space-y-1">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400">
                      Nossa Estrutura
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {activeImages[0].alt || `Sede ${store}`}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Imagens Secundárias */}
              {activeImages.slice(1, 5).map((img, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-zinc-800/80 group shadow-md"
                >
                  <Image
                    src={img.url!}
                    alt={img.alt || `${displayTitle} - Foto ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-zinc-950/20 group-hover:bg-transparent transition-colors" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Conteúdo Institucional: Texto de Apresentação & Detalhes */}
      {(description || additionalText) && (
        <section className="container mx-auto px-4 sm:px-6 py-12 md:py-16 max-w-4xl">
          <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 p-8 sm:p-12 rounded-3xl shadow-xl space-y-8 relative overflow-hidden">
            {/* Decoração sutil de fundo */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-3 pb-6 border-b border-zinc-800/80">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                  Quem Somos
                </h2>
                <p className="text-xs text-zinc-400">
                  O compromisso que move a {store} todos os dias
                </p>
              </div>
            </div>

            {description && (
              <div className="text-zinc-300 text-base sm:text-lg leading-relaxed space-y-4 whitespace-pre-line font-normal">
                {description}
              </div>
            )}

            {additionalText && (
              <div className="p-6 rounded-2xl bg-zinc-950/80 border border-amber-500/20 text-zinc-300 relative">
                <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>Destaque Institucional</span>
                </div>
                <div className="text-sm sm:text-base leading-relaxed text-zinc-300 whitespace-pre-line">
                  {additionalText}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

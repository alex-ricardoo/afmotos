'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, LucideIcon, Sparkles } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { cn } from '@/lib/utils';

export interface UtilityItem {
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  label: string;
}

export interface PricingCardProps {
  id?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  originalPrice?: string;
  currentPrice: string;
  unitPriceLabel?: string;
  priceSubtext?: string;
  discountBadge?: string;
  isPopular?: boolean;
  popularBadgeText?: string;
  badge?: string;
  features: string[];
  utilityGrid?: UtilityItem[];
  ctaText: string;
  ctaHref?: string;
  onCtaClick?: (e: React.MouseEvent) => void;
  ctaVariant?: 'primary' | 'whatsapp' | 'outline' | 'secondary';
  ctaIcon?: 'arrow' | 'whatsapp' | 'none';
  disabled?: boolean;
  loading?: boolean;
  footerNotice?: React.ReactNode;
  className?: string;
}

/**
 * PricingCard - Componente de Alta Conversão Mobile-First
 * 
 * Decisões de UX/UI aplicadas:
 * 1. Superfície: bg-slate-900/80 com border-white/5 e backdrop-blur-sm para profundidade sem poluição visual.
 * 2. Hierarquia de Preços: Preço âncora anterior riscado (line-through text-slate-500 text-sm) e preço vigente com destaque máximo (text-4xl font-black text-white).
 * 3. Indicador de Popularidade: Tag centralizada com anel sutil ring-1 ring-blue-500 para guiar a atenção do usuário.
 * 4. Micro-interações: active:scale-[0.98] em botões de CTA para feedback tátil instantâneo no mobile.
 * 5. Grid Utilitário: Transforma blocos densos em grid 2 colunas no mobile facilitando escaneabilidade rápida.
 */
export function PricingCard({
  id,
  title,
  subtitle,
  tagline,
  originalPrice,
  currentPrice,
  unitPriceLabel,
  priceSubtext,
  discountBadge,
  isPopular = false,
  popularBadgeText = 'MAIS POPULAR',
  badge,
  features,
  utilityGrid,
  ctaText,
  ctaHref,
  onCtaClick,
  ctaVariant = 'primary',
  ctaIcon = 'arrow',
  disabled = false,
  loading = false,
  footerNotice,
  className,
}: PricingCardProps) {
  // Determina classes do botão baseado na variante e foco em conversão
  const getCtaStyles = () => {
    if (ctaVariant === 'whatsapp') {
      return 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold shadow-lg shadow-emerald-900/30';
    }
    if (isPopular || ctaVariant === 'primary') {
      return 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-lg shadow-blue-900/40';
    }
    if (ctaVariant === 'secondary') {
      return 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 font-semibold border border-white/10';
    }
    return 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10';
  };

  const renderCtaContent = () => (
    <>
      <span className="truncate">{ctaText}</span>
      {ctaIcon === 'whatsapp' && (
        <WhatsAppIcon className="w-4 h-4 fill-current text-white shrink-0" />
      )}
      {ctaIcon === 'arrow' && <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />}
    </>
  );

  return (
    <div
      id={id}
      className={cn(
        'relative rounded-3xl p-5 sm:p-6 lg:p-4.5 xl:p-5 2xl:p-6 flex flex-col justify-between transition-all duration-300',
        'bg-slate-900/80 backdrop-blur-sm border shadow-xl shadow-black/40',
        isPopular
          ? 'border-blue-500/50 ring-1 ring-blue-500/60 shadow-blue-950/30'
          : 'border-white/5 hover:border-white/15',
        className,
      )}
    >
      {/* Badge Flutuante "MAIS POPULAR" no topo centro */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
          <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-900/50 border border-blue-400/30">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{popularBadgeText}</span>
          </span>
        </div>
      )}

      <div>
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-white/5">
          <div className="space-y-1">
            {badge && (
              <span className="inline-block text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                {badge}
              </span>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-slate-50 tracking-tight leading-snug">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>

          {discountBadge && (
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold whitespace-nowrap bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
              {discountBadge}
            </span>
          )}
        </div>

        {tagline && (
          <p className="text-xs text-slate-400 pt-3 leading-relaxed min-h-[32px]">
            {tagline}
          </p>
        )}

        {/* Bloco de Preço: Ancoragem com valor antigo e valor agressivo */}
        <div className="py-4 sm:py-5">
          {originalPrice && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-slate-400">De</span>
              <span className="line-through text-slate-500 text-xs sm:text-sm font-medium">
                {originalPrice}
              </span>
              <span className="text-xs text-slate-400">por:</span>
            </div>
          )}

          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span
              className={cn(
                'font-black text-white tracking-tight leading-tight',
                currentPrice.length > 8 || currentPrice.toLowerCase().includes('consulta')
                  ? 'text-xl sm:text-2xl lg:text-xl xl:text-2xl'
                  : 'text-2xl sm:text-3xl lg:text-[22px] xl:text-3xl',
              )}
            >
              {currentPrice}
            </span>
            {unitPriceLabel && (
              <span className="text-xs text-slate-400 font-normal">
                {unitPriceLabel}
              </span>
            )}
          </div>

          {priceSubtext && (
            <p className="text-[11px] text-slate-400 mt-1 leading-snug font-medium">{priceSubtext}</p>
          )}
        </div>

        {/* Lista de Benefícios com Ícones Alinhados */}
        {features.length > 0 && (
          <div className="space-y-2.5 pb-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              O que está incluso:
            </p>
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="leading-snug">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* Grid Utilitário de 2 Colunas para o Mobile (Escaneabilidade de Recursos Extras) */}
        {utilityGrid && utilityGrid.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5 pb-5 pt-1">
            {utilityGrid.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-300"
                >
                  <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ação CTA com Micro-interações táteis */}
      <div className="pt-3 space-y-2.5">
        {ctaHref ? (
          <Link
            href={ctaHref}
            className={cn(
              'w-full min-h-[48px] py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm transition-transform duration-150 active:scale-[0.98]',
              getCtaStyles(),
            )}
          >
            {renderCtaContent()}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onCtaClick}
            disabled={disabled || loading}
            className={cn(
              'w-full min-h-[48px] py-3 px-5 rounded-xl flex items-center justify-center gap-2 text-sm transition-transform duration-150 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
              getCtaStyles(),
            )}
          >
            {renderCtaContent()}
          </button>
        )}

        {footerNotice && (
          <div className="text-center pt-1 text-[11px] text-slate-400">{footerNotice}</div>
        )}
      </div>
    </div>
  );
}

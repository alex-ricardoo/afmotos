'use client';

import React from 'react';
import Link from 'next/link';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Lock,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  MercadoPagoBrandIcon,
  PixBrandIcon,
  CreditCardBrandIcon,
  CaixaDebitBrandIcon,
  BoletoBrandIcon,
} from '@/components/customer/payment-brand-icons';
import { VehicleHistorySettings } from '@/types/site-settings';
import { buildVehicleHistoryB2BWhatsAppUrl } from '@/lib/utils/whatsapp';
import type { CreditPackageOffer } from '@/lib/credits/types';
import { useVehicleHistory } from './vehicle-history-context';

interface VehicleHistoryPricingProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
  offers?: CreditPackageOffer[];
}

const CHECKLIST_ITEMS = [
  'Histórico de Leilão, Batidas Graves & Sinistro',
  'Alienação Fiduciária (Dívidas ativas com Bancos)',
  'Bloqueios na Justiça (Renajud) & Alerta de Furto',
  'Débitos Estaduais, IPVA e Multas em aberto',
  'Área do Cliente: laudos salvos com acesso vitalício',
  'Download do Laudo Oficial em PDF pronto para imprimir',
  'Plataforma multi-veículos: consulte quantas placas precisar',
  'Ambiente Mercado Pago: Pix imediato, Cartão até 12x, Débito e Boleto',
];

export function VehicleHistoryPricing({
  settings,
  siteName,
  defaultPhone,
  offers = [],
}: VehicleHistoryPricingProps) {
  const { isValid, formattedPlate, scrollToSection } = useVehicleHistory();
  const phone = settings.whatsappPhoneOverride || defaultPhone;
  const rawPrice = settings.price || 39.9;
  const formattedPrice = rawPrice.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  const competitorPrice = 64.9;
  const savings = Math.max(0, competitorPrice - rawPrice);
  const formattedSavings = savings.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleB2CClick = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToSection('consulta-placa');
  };

  const handleB2BClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = buildVehicleHistoryB2BWhatsAppUrl(phone);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Se existirem ofertas ativas no catálogo oficial do banco, calcula os tiers dinamicamente
  const b2bTiers =
    offers.length > 0
      ? offers.map((off) => {
          const isWa = off.contact_only || off.requires_whatsapp || off.credits_quantity >= 50;
          const unitCents =
            off.credits_quantity > 0 ? Math.round(off.price_cents / off.credits_quantity) : 0;
          const unitPrice = isWa
            ? 'Sob consulta'
            : (unitCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
          const discount = isWa
            ? 'Sob Medida'
            : off.discount_percent
              ? `${off.discount_percent}% OFF`
              : 'Especial';

          return {
            qty: isWa ? `${off.credits_quantity}+` : off.credits_quantity,
            name: off.name,
            discount,
            unitPrice,
            highlight: Boolean(off.highlight || off.is_featured),
            badge: off.badge || (off.highlight ? 'Mais Vendido' : undefined),
            contactOnly: isWa,
          };
        })
      : [
          {
            qty: 5,
            name: 'Inicial',
            discount: '5% OFF',
            unitPrice: (rawPrice * 0.95).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            highlight: false,
            badge: undefined,
            contactOnly: false,
          },
          {
            qty: 15,
            name: 'Lojista',
            discount: '8% OFF',
            unitPrice: (rawPrice * 0.92).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            highlight: true,
            badge: 'Mais Vendido',
            contactOnly: false,
          },
          {
            qty: 30,
            name: 'Frotista',
            discount: '12% OFF',
            unitPrice: (rawPrice * 0.88).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            highlight: false,
            badge: undefined,
            contactOnly: false,
          },
          {
            qty: '50+',
            name: 'Enterprise',
            discount: '15% OFF',
            unitPrice: (rawPrice * 0.85).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            highlight: false,
            badge: undefined,
            contactOnly: true,
          },
        ];

  const maxDiscount =
    offers.length > 0 ? Math.max(...offers.map((o) => o.discount_percent || 0), 15) : 15;

  return (
    <section
      id="precos-historico"
      className="py-12 sm:py-20 bg-[#080B11] border-t border-[#1F293D] relative overflow-hidden"
    >
      {/* Subtle Glow Background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Investimento Inteligente</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            O menor custo para evitar a maior dor de cabeça
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
            Blindar sua compra antes de transferir dinheiro custa menos de uma troca de óleo.
          </p>
        </div>

        {/* Compact Loss Aversion & Competitor Comparison Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-2xl bg-[#0F1420] border border-[#1F293D]">
          {/* Risk Pill */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-950/25 border border-red-500/20">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                Risco sem o Laudo
              </span>
              <p className="text-xs text-zinc-300 leading-snug">
                Prejuízo de <strong className="text-red-300">R$ 5.000 a R$ 25.000</strong> com
                leilão maquiado, processo ou golpe.
              </p>
            </div>
          </div>

          {/* Solution & Competitor Price Anchor Pill */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/25">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Aqui na {siteName}
                </span>
                <span className="text-[10px] text-zinc-400 line-through">Outros: R$ 64,90</span>
              </div>
              <p className="text-xs text-zinc-200 leading-snug">
                Mesmo laudo oficial por apenas{' '}
                <strong className="text-amber-400 font-mono text-sm">{formattedPrice}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Master Plan Checkout Card */}
        <div className="relative rounded-3xl p-5 sm:p-8 bg-gradient-to-b from-[#131A26] to-[#0D121D] border-2 border-amber-500/40 shadow-2xl shadow-black/80 backdrop-blur-xl">
          {/* Card Header & Price Display */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#1F293D]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-[10px] uppercase tracking-wider">
                  100% Oficial Senatran
                </span>
                {savings > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Economize {formattedSavings}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-2xl font-black text-white font-heading">
                {isValid && formattedPlate ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Laudo do Veículo Placa {formattedPlate}
                  </span>
                ) : (
                  'Laudo Oficial de Histórico Veicular'
                )}
              </h3>

              <p className="text-xs text-zinc-400">
                Válido para qualquer carro, moto ou caminhão em todo o Brasil.
              </p>
            </div>

            {/* Price Box */}
            <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 sm:p-0 rounded-xl bg-slate-950/60 sm:bg-transparent border border-slate-800/80 sm:border-0">
              <div className="text-left sm:text-right">
                <span className="text-[11px] text-zinc-400 block sm:inline">
                  Em outros sites:{' '}
                  <span className="line-through font-semibold text-zinc-500">R$ 64,90</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 block sm:hidden">
                  Preço exclusivo AF Motos
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-xs font-bold text-amber-300 uppercase sm:hidden">Por</span>
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {formattedPrice}
                </span>
              </div>
            </div>
          </div>

          {/* Included Features List */}
          <div className="py-5">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
              O que você recebe no laudo oficial:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {CHECKLIST_ITEMS.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs sm:text-sm text-zinc-200 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action CTA & Micro-Guarantees */}
          <div className="pt-2 space-y-3">
            <button
              type="button"
              id="btn-pricing-consultar-avulso"
              onClick={handleB2CClick}
              className="w-full min-h-[52px] py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/50"
            >
              <span className="whitespace-nowrap">
                {isValid
                  ? `Consultar Placa ${formattedPlate} Agora`
                  : 'Consultar Minha Placa Agora'}
              </span>
              <ArrowRight className="w-5 h-5 stroke-[3] shrink-0" />
            </button>

            {/* Banner Oficial Mercado Pago & Formas de Pagamento */}
            <div className="rounded-2xl bg-[#090D15]/90 border border-zinc-800 p-3 sm:p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#009ee3] shadow-sm shrink-0">
                    <MercadoPagoBrandIcon className="h-3.5 w-3.5 text-[#009ee3]" />
                  </div>
                  <span className="text-xs font-bold text-white">
                    Processado via Mercado Pago Oficial
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Ambiente 100% Criptografado
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-zinc-800/80">
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-medium text-zinc-300">
                  <PixBrandIcon className="h-3.5 w-3.5 text-[#00bdae] shrink-0" />
                  <span className="truncate">Pix Instantâneo</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-medium text-zinc-300">
                  <CreditCardBrandIcon className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span className="truncate">Cartão até 12x</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-medium text-zinc-300">
                  <CaixaDebitBrandIcon className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Débito Caixa</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-medium text-zinc-300">
                  <BoletoBrandIcon className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Boleto / Saldo MP</span>
                </div>
              </div>
            </div>

            {/* Micro-Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Segurança Mercado Pago
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Liberação instantânea no seu painel
              </span>
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                PDF oficial para salvar e imprimir
              </span>
            </div>
          </div>
        </div>

        {/* Showcase B2B / Volume / Pacotes para Lojistas (Mobile First) */}
        <div className="relative rounded-3xl p-4 sm:p-7 lg:p-8 bg-gradient-to-b from-[#111726] via-[#0d121f] to-[#090d16] border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(245,158,11,0.08)] overflow-hidden space-y-5 sm:space-y-6 mb-12 sm:mb-0">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header Bar */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-bold w-fit">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-300">Pacotes B2B & Lojistas</span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-400">Até {maxDiscount}% OFF</span>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight font-heading">
                Pacotes de Créditos com Compra Online
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                Avalia veículos frequentemente? Compre pacotes com desconto progressivo direto pelo{' '}
                <strong>Mercado Pago</strong> e consulte placas em 1 clique na sua{' '}
                <strong>Área do Cliente</strong> com liberação automática instantânea dos créditos.
                Para frotas a partir de 50 consultas, conte com negociação sob medida via WhatsApp.
              </p>
            </div>

            {/* Quick CTAs on desktop header */}
            <div className="hidden lg:flex flex-col items-end gap-1.5 shrink-0">
              <Link
                href="/cliente/creditos#pacotes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all active:scale-[0.98]"
              >
                <span>Comprar Pacotes Online</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
              </Link>
              <span className="text-[10px] text-zinc-400">
                ⚡ Liberação automática no Mercado Pago
              </span>
            </div>
          </div>

          {/* MOBILE VIEW: Clean Stacked Horizontal Tier Strips (sm:hidden) */}
          <div className="space-y-2.5 sm:hidden relative z-10">
            {b2bTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-3 sm:p-3.5 flex items-center justify-between border transition-all ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-amber-500/15 via-[#161f33] to-[#101726] border-amber-500/60 shadow-md shadow-amber-500/10'
                    : 'bg-[#090d16]/90 border-zinc-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-center justify-center font-black text-white shrink-0">
                    <span className="text-sm font-heading leading-none text-amber-300">
                      {tier.qty}
                    </span>
                    <span className="text-[9px] text-zinc-400 font-normal leading-none mt-0.5">
                      un
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-white">{tier.name}</span>
                      {tier.badge && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold whitespace-nowrap leading-none">
                          ★ {tier.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      {tier.contactOnly || String(tier.qty).includes('50')
                        ? 'Demanda sob medida'
                        : `${tier.qty} laudos veiculares`}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-black text-white font-mono">
                      {tier.unitPrice}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-black whitespace-nowrap">
                      {tier.discount}
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-400 block">
                    {tier.contactOnly ? 'sob medida' : 'por consulta'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP & TABLET VIEW: 4-Column Grid (hidden sm:grid) */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10">
            {b2bTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-amber-500/15 via-[#161f33] to-[#101726] border-2 border-amber-500/60 shadow-lg shadow-amber-500/10'
                    : 'bg-[#090d16]/90 hover:bg-[#0e1422] border border-zinc-800/90'
                }`}
              >
                {tier.badge && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                    ★ {tier.badge}
                  </span>
                )}

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                    {tier.name}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-black text-white font-heading">
                      {tier.qty}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">consultas</span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">
                      {tier.contactOnly ? 'Negociação' : 'A partir de'}
                    </span>
                    <span className="text-xs sm:text-sm font-black text-white font-mono">
                      {tier.unitPrice}
                    </span>
                    {!tier.contactOnly && <span className="text-[10px] text-zinc-400"> /un</span>}
                  </div>
                  <span className="px-2 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-black text-xs whitespace-nowrap">
                    {tier.discount}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Value Guarantees (Clean grid on mobile) */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-4 gap-2 py-1 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span>Pix imediato ou Cartão até 12x</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span>Liberação automática imediata</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span>Créditos nunca expiram</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span>Devolução automática em falha</span>
            </div>
          </div>

          {/* Action Buttons (Compact, single-line, mobile-first) */}
          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <Link
              href="/cliente/creditos#pacotes"
              className="w-full sm:flex-1 min-h-[44px] sm:min-h-[48px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/35 transition-all active:scale-[0.98] text-center cursor-pointer"
            >
              <span className="whitespace-nowrap">Comprar Pacotes com Desconto Online</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5] shrink-0" />
            </Link>

            <button
              type="button"
              onClick={handleB2BClick}
              className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Frotas e Grandes Volumes (50+)</span>
            </button>
          </div>

          {/* Micro Footer Notice */}
          <div className="relative z-10 pt-2 text-center border-t border-zinc-800/60">
            <p className="text-[11px] text-zinc-400 flex items-center justify-center gap-1.5 flex-wrap">
              <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Os créditos adquiridos são vinculados com segurança ao seu usuário.{' '}
                <Link
                  href="/cliente/cadastro?returnUrl=%2Fcliente%2Fcreditos"
                  className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2"
                >
                  Crie sua conta grátis
                </Link>{' '}
                ou{' '}
                <Link
                  href="/cliente/login?returnUrl=%2Fcliente%2Fcreditos"
                  className="text-amber-400 hover:text-amber-300 font-bold underline underline-offset-2"
                >
                  faça login
                </Link>{' '}
                para comprar online e gerenciar seus laudos.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

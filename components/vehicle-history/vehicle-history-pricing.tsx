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
          const totalPrice = isWa
            ? 'Sob consulta'
            : (off.price_cents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              });
          const discount = isWa
            ? 'Sob Medida'
            : off.discount_percent
              ? `${Math.round(off.discount_percent)}% OFF`
              : 'Especial';

          const cleanName = off.name.replace(/^pacote\s+/i, '');

          const defaultTagline = isWa
            ? 'Condições sob medida para frotas e concessionárias'
            : off.credits_quantity >= 30
              ? 'Máxima economia para alto giro de placas'
              : off.credits_quantity >= 15
                ? 'O favorito de revendas, lojistas e corretores'
                : 'Ideal para avaliações pontuais com economia';

          const defaultPerks = isWa
            ? [
                'Volume a partir de 50 consultas',
                'Faturamento corporativo via boleto PJ',
                'Atendimento comercial prioritário',
              ]
            : [
                `${off.credits_quantity} laudos veiculares completos`,
                'Liberação imediata no Mercado Pago',
                'Créditos sem data de expiração',
              ];

          const isPopular = Boolean(
            off.highlight || off.is_featured || off.credits_quantity === 15,
          );
          const badge =
            off.badge ||
            (isPopular
              ? 'Mais Vendido'
              : isWa
                ? 'Corporativo'
                : off.credits_quantity >= 30
                  ? 'Custo-Benefício'
                  : undefined);

          return {
            id: off.id,
            qty: isWa ? `${off.credits_quantity}+` : off.credits_quantity,
            name: cleanName,
            fullName: off.name,
            tagline: off.tagline || defaultTagline,
            discount,
            unitPrice,
            totalPrice,
            perks: off.perks && off.perks.length > 0 ? off.perks.slice(0, 3) : defaultPerks,
            highlight: isPopular,
            badge,
            contactOnly: isWa,
          };
        })
      : [
          {
            id: 'starter',
            qty: 5,
            name: 'Essencial',
            fullName: 'Pacote Essencial',
            tagline: 'Ideal para avaliações pontuais com economia',
            discount: '5% OFF',
            unitPrice: (rawPrice * 0.95).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            totalPrice: (rawPrice * 0.95 * 5).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            perks: [
              '5 laudos veiculares completos',
              'Liberação imediata no Mercado Pago',
              'Créditos sem data de expiração',
            ],
            highlight: false,
            badge: undefined,
            contactOnly: false,
          },
          {
            id: 'pro',
            qty: 15,
            name: 'Profissional',
            fullName: 'Pacote Profissional',
            tagline: 'O favorito de revendas, lojistas e corretores',
            discount: '8% OFF',
            unitPrice: (rawPrice * 0.92).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            totalPrice: (rawPrice * 0.92 * 15).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            perks: [
              '15 laudos veiculares completos',
              'Maior economia por consulta',
              'Créditos sem data de expiração',
            ],
            highlight: true,
            badge: 'Mais Vendido',
            contactOnly: false,
          },
          {
            id: 'business',
            qty: 30,
            name: 'Premium',
            fullName: 'Pacote Premium',
            tagline: 'Máxima economia para alto giro de placas',
            discount: '12% OFF',
            unitPrice: (rawPrice * 0.88).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            totalPrice: (rawPrice * 0.88 * 30).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
            perks: [
              '30 laudos veiculares completos',
              'Menor custo por laudo veicular',
              'Créditos sem data de expiração',
            ],
            highlight: false,
            badge: 'Custo-Benefício',
            contactOnly: false,
          },
          {
            id: 'enterprise',
            qty: '50+',
            name: 'Enterprise',
            fullName: 'Pacote Enterprise',
            tagline: 'Condições sob medida para frotas e concessionárias',
            discount: 'Sob Medida',
            unitPrice: 'Sob consulta',
            totalPrice: 'Sob consulta',
            perks: [
              'Volume a partir de 50 consultas',
              'Faturamento corporativo via boleto PJ',
              'Atendimento comercial prioritário',
            ],
            highlight: false,
            badge: 'Corporativo',
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Investimento Inteligente</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading">
            O menor custo para evitar a maior dor de cabeça
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Blindar sua compra antes de transferir dinheiro custa menos de uma troca de óleo.
          </p>
        </div>

        {/* Compact Loss Aversion & Competitor Comparison Bar */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-2xl bg-[#0F1420] border border-[#1F293D]">
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
        <div className="max-w-3xl mx-auto relative rounded-3xl p-5 sm:p-8 bg-gradient-to-b from-[#131A26] to-[#0D121D] border-2 border-amber-500/40 shadow-2xl shadow-black/80 backdrop-blur-xl">
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

        {/* Showcase B2B / Volume / Pacotes para Lojistas (Desktop & Mobile) */}
        <div className="relative rounded-3xl p-5 sm:p-7 lg:p-8 bg-gradient-to-b from-[#111726] via-[#0d121f] to-[#090d16] border border-amber-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(245,158,11,0.08)] overflow-hidden space-y-6 mb-12 sm:mb-0">
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
              <p className="text-xs sm:text-sm text-zinc-300 max-w-3xl leading-relaxed">
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

          {/* MOBILE VIEW: Senior High-Usability Cards (sm:hidden) */}
          <div className="space-y-4 sm:hidden relative z-10">
            {b2bTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-300 ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-[#182033] via-[#111726] to-[#0a0e17] border-2 border-[#c9a44c] shadow-[0_10px_35px_rgba(201,164,76,0.22)] ring-1 ring-[#c9a44c]/40'
                    : 'bg-[#0d131f]/95 border border-zinc-800 shadow-md'
                }`}
              >
                {/* Top Header: Title + Discount */}
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                      {tier.fullName}
                    </span>
                    {tier.highlight && (
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                        ★ Mais Vendido
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap shrink-0 ${
                      tier.highlight
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {tier.discount}
                  </span>
                </div>

                {/* Main Body: Quantity & Price */}
                <div className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-white font-heading tracking-tight">
                        {tier.qty}
                      </span>
                      <span className="text-xs font-bold text-zinc-400">
                        {typeof tier.qty === 'number' && tier.qty === 1 ? 'consulta' : 'consultas'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">{tier.tagline}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-zinc-400 block uppercase font-medium">
                      {tier.contactOnly ? 'Condição' : 'Por consulta'}
                    </span>
                    <div className="flex items-baseline justify-end gap-1">
                      <span
                        className={`text-xl font-black font-mono tracking-tight ${
                          tier.contactOnly ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {tier.unitPrice}
                      </span>
                      {!tier.contactOnly && <span className="text-[10px] text-zinc-400">/un</span>}
                    </div>
                    {!tier.contactOnly && (
                      <span className="text-[10px] text-zinc-400 block font-medium">
                        Total {tier.totalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Perks Checklist */}
                <div className="pt-2.5 border-t border-zinc-800/80 space-y-1.5 pb-3">
                  {tier.perks.map((perk, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-zinc-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="text-[11px] text-zinc-300">{perk}</span>
                    </div>
                  ))}
                </div>

                {/* Action Button inside Mobile Card */}
                {tier.contactOnly ? (
                  <button
                    type="button"
                    onClick={handleB2BClick}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-current text-emerald-400 shrink-0" />
                    <span>Falar no WhatsApp (+50 consultas)</span>
                  </button>
                ) : (
                  <Link
                    href="/cliente/creditos#pacotes"
                    className={`w-full h-11 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-amber-500/20'
                        : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white'
                    }`}
                  >
                    <span>Comprar Pacote ({tier.qty} consultas)</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* DESKTOP & TABLET VIEW: Spacious 4-Column Grid (hidden sm:grid) */}
          <div className="hidden sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-5 relative z-10 items-stretch">
            {b2bTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-5 lg:p-6 flex flex-col justify-between transition-all duration-300 ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-[#1c2438] via-[#121826] to-[#0a0e17] border-2 border-[#c9a44c] shadow-[0_12px_40px_rgba(201,164,76,0.22)] xl:-translate-y-2 ring-1 ring-[#c9a44c]/40'
                    : 'bg-gradient-to-b from-[#111726] to-[#0A0E17] hover:bg-[#151d30] border border-slate-800/90 hover:border-slate-700 shadow-lg'
                }`}
              >
                {/* Top Floating Badge for Highlighted Package Only */}
                {tier.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md">
                      ★ Mais Vendido
                    </span>
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  {/* Header: Name + Discount Pill */}
                  <div className="border-b border-zinc-800/70 pb-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider block">
                          Pacote
                        </span>
                        <h4 className="text-base lg:text-lg font-black text-white tracking-tight leading-tight">
                          {tier.name}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-md text-[11px] font-black whitespace-nowrap ${
                          tier.highlight
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {tier.discount}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-3">
                      <span className="text-3xl lg:text-4xl font-black text-white font-heading tracking-tight">
                        {tier.qty}
                      </span>
                      <span className="text-xs font-semibold text-zinc-400">
                        {typeof tier.qty === 'number' && tier.qty === 1 ? 'consulta' : 'consultas'}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-400 mt-1.5 min-h-[36px] leading-relaxed">
                      {tier.tagline}
                    </p>
                  </div>

                  {/* Price Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] uppercase font-bold text-zinc-400">
                      <span>{tier.contactOnly ? 'Condição' : 'Preço Unitário'}</span>
                      {!tier.contactOnly && (
                        <span className="text-emerald-400 font-extrabold">{tier.discount}</span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5">
                      <span
                        className={`font-black font-mono tracking-tight ${
                          tier.contactOnly
                            ? 'text-2xl text-emerald-400'
                            : 'text-2xl lg:text-3xl text-white'
                        }`}
                      >
                        {tier.unitPrice}
                      </span>
                      {!tier.contactOnly && (
                        <span className="text-xs font-medium text-zinc-400">/unidade</span>
                      )}
                    </div>

                    <div className="text-xs text-zinc-400 pt-1.5 border-t border-slate-800/80">
                      {tier.contactOnly ? (
                        <span className="text-zinc-300 font-medium">Faturamento PJ sob medida</span>
                      ) : (
                        <span>
                          Total:{' '}
                          <strong className="text-zinc-200 font-mono">{tier.totalPrice}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Perks */}
                  <div className="border-t border-zinc-800/70 pt-3.5 space-y-2.5">
                    {tier.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="leading-snug text-xs text-zinc-300">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Button inside card */}
                <div className="pt-4 mt-4 border-t border-zinc-800/70">
                  {tier.contactOnly ? (
                    <button
                      type="button"
                      onClick={handleB2BClick}
                      className="w-full h-11 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <WhatsAppIcon className="w-4 h-4 fill-current text-emerald-400 shrink-0" />
                      <span>Falar no WhatsApp</span>
                    </button>
                  ) : (
                    <Link
                      href="/cliente/creditos#pacotes"
                      className={`w-full h-11 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                        tier.highlight
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                          : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white hover:text-amber-300'
                      }`}
                    >
                      <span>Comprar Pacote</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Value Guarantees (Clean grid on mobile) */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1 text-xs text-zinc-300">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px]">Pix imediato ou Cartão até 12x</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px]">Liberação automática imediata</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px]">Créditos nunca expiram</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px]">Devolução automática em falha</span>
            </div>
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

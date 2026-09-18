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
import { PricingCard, UtilityItem } from './pricing-card';

interface VehicleHistoryPricingProps {
  settings: VehicleHistorySettings;
  siteName: string;
  defaultPhone: string;
  offers?: CreditPackageOffer[];
}

const B2C_FEATURES = [
  'Histórico de Leilão, Batidas Graves & Sinistro',
  'Alienação Fiduciária (Dívidas ativas com Bancos)',
  'Bloqueios na Justiça (Renajud) & Alerta de Furto',
  'Débitos Estaduais, IPVA e Multas em aberto',
  'Área do Cliente: laudos salvos com acesso vitalício',
  'Download do Laudo Oficial em PDF pronto para imprimir',
  'Plataforma multi-veículos: consulte quantas placas precisar',
  'Ambiente Mercado Pago: Pix imediato, Cartão até 12x, Débito e Boleto',
];

const PAYMENT_UTILITIES: UtilityItem[] = [
  { icon: PixBrandIcon, label: 'Pix Instantâneo' },
  { icon: CreditCardBrandIcon, label: 'Cartão até 12x' },
  { icon: CaixaDebitBrandIcon, label: 'Débito Caixa' },
  { icon: BoletoBrandIcon, label: 'Boleto / Saldo MP' },
];

/**
 * VehicleHistoryPricing - Seção de Preços e Pacotes de Créditos
 * 
 * Decisões de UX/UI aplicadas:
 * 1. Paleta Dark Mode Refinada: Fundo em bg-slate-950, superfícies de cards em bg-slate-900/80 com border-white/5.
 * 2. Ancoragem de Preço e Perda: Barra comparativa superior demonstrando o risco financeiro de não consultar e a economia imediata.
 * 3. Componentização com PricingCard: Reutilização consistente do componente para o laudo avulso e para os pacotes B2B.
 * 4. Foco Mobile-First: Grid 2 colunas para meios de pagamento e garantias utilitárias, botões com altura mínima de 48px e active:scale-[0.98].
 * 5. Cores Funcionais de Ação: Azul de conversão e segurança para compra/checkout e verde esmeralda para suporte comercial no WhatsApp.
 */
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
      className="py-12 sm:py-20 bg-slate-950 border-t border-white/5 relative overflow-hidden"
    >
      {/* Glow Sutil de Fundo */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-80 bg-amber-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Investimento Inteligente</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-50 tracking-tight font-heading">
            O menor custo para evitar a maior dor de cabeça
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            Blindar sua compra antes de transferir dinheiro custa menos de uma troca de óleo.
          </p>
        </div>

        {/* Barra de Aversão à Perda & Comparativo de Mercado */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-2xl bg-slate-900/80 border border-white/5 shadow-xl shadow-black/30 backdrop-blur-sm">
          {/* Card de Risco */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-red-950/20 border border-red-500/20">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">
                Risco sem o Laudo
              </span>
              <p className="text-xs text-slate-300 leading-snug">
                Prejuízo de <strong className="text-red-300">R$ 5.000 a R$ 25.000</strong> com
                leilão maquiado, processo ou golpe.
              </p>
            </div>
          </div>

          {/* Card de Solução com Preço Âncora */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Aqui na {siteName}
                </span>
                <span className="text-[10px] text-slate-500 line-through">Outros: R$ 64,90</span>
              </div>
              <p className="text-xs text-slate-200 leading-snug">
                Mesmo laudo oficial por apenas{' '}
                <strong className="text-amber-400 font-mono text-sm">{formattedPrice}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Master Plan Checkout Card (Laudo Oficial Avulso B2C) */}
        <div className="max-w-3xl mx-auto">
          <PricingCard
            title={
              isValid && formattedPlate
                ? `Laudo do Veículo Placa ${formattedPlate}`
                : 'Laudo Oficial de Histórico Veicular'
            }
            badge="100% Oficial Senatran"
            tagline="Válido para qualquer carro, moto ou caminhão em todo o território nacional."
            originalPrice="R$ 64,90"
            currentPrice={formattedPrice}
            unitPriceLabel="/consulta única"
            priceSubtext={
              savings > 0
                ? `Você economiza ${formattedSavings} em relação a concorrentes do mercado`
                : undefined
            }
            discountBadge={savings > 0 ? `Economize ${formattedSavings}` : undefined}
            isPopular={true}
            popularBadgeText="MAIS ESCOLHIDO"
            features={B2C_FEATURES}
            utilityGrid={PAYMENT_UTILITIES}
            ctaText={
              isValid
                ? `Consultar Placa ${formattedPlate} Agora`
                : 'Consultar Minha Placa Agora'
            }
            onCtaClick={handleB2CClick}
            ctaVariant="primary"
            ctaIcon="arrow"
            footerNotice={
              <div className="space-y-3 pt-2">
                {/* Banner Oficial Mercado Pago */}
                <div className="rounded-2xl bg-slate-950/70 border border-white/5 p-3 sm:p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#009ee3] shadow-sm shrink-0">
                        <MercadoPagoBrandIcon className="h-3.5 w-3.5 text-[#009ee3]" />
                      </div>
                      <span className="text-xs font-bold text-slate-100">
                        Processado via Mercado Pago Oficial
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Ambiente Criptografado
                    </span>
                  </div>
                </div>

                {/* Micro-Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Segurança Mercado Pago
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    Liberação instantânea no painel
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    PDF oficial para imprimir
                  </span>
                </div>
              </div>
            }
          />
        </div>

        {/* Vitrine de Pacotes B2B / Volume para Lojistas e Frotas */}
        <div className="relative rounded-3xl p-6 sm:p-8 bg-slate-900/80 backdrop-blur-sm border border-white/5 shadow-xl shadow-black/40 space-y-6">
          {/* Header dos Pacotes B2B */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs font-bold w-fit">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-amber-400">Pacotes B2B & Lojistas</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400">Até {maxDiscount}% OFF</span>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-50 tracking-tight font-heading">
                Pacotes de Créditos com Compra Online
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
                Avalia veículos frequentemente? Compre pacotes com desconto progressivo direto pelo{' '}
                <strong className="text-slate-200">Mercado Pago</strong> e consulte placas em 1 clique na sua{' '}
                <strong className="text-slate-200">Área do Cliente</strong> com liberação automática instantânea dos créditos.
                Para frotas a partir de 50 consultas, conte com negociação sob medida via WhatsApp.
              </p>
            </div>

            {/* CTA Desktop */}
            <div className="hidden lg:flex flex-col items-end gap-1.5 shrink-0">
              <Link
                href="/cliente/creditos#pacotes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-lg shadow-blue-900/30 transition-transform active:scale-[0.98]"
              >
                <span>Comprar Pacotes Online</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </Link>
              <span className="text-[10px] text-slate-400">
                ⚡ Liberação automática no Mercado Pago
              </span>
            </div>
          </div>

          {/* Grid de Cards dos Pacotes B2B (1 coluna no mobile, 2 em tablet, 4 em desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 relative z-10 items-stretch">
            {b2bTiers.map((tier) => (
              <PricingCard
                key={tier.name}
                title={tier.name}
                badge={tier.badge}
                tagline={tier.tagline}
                discountBadge={tier.discount}
                isPopular={tier.highlight}
                popularBadgeText="MAIS VENDIDO"
                currentPrice={tier.unitPrice}
                unitPriceLabel={tier.contactOnly ? '' : '/unidade'}
                priceSubtext={
                  tier.contactOnly
                    ? 'Faturamento PJ sob medida'
                    : `Total do pacote: ${tier.totalPrice}`
                }
                features={tier.perks}
                ctaText={
                  tier.contactOnly
                    ? 'Falar no WhatsApp'
                    : `Comprar (${tier.qty} consultas)`
                }
                ctaHref={tier.contactOnly ? undefined : '/cliente/creditos#pacotes'}
                onCtaClick={tier.contactOnly ? handleB2BClick : undefined}
                ctaVariant={
                  tier.contactOnly
                    ? 'whatsapp'
                    : tier.highlight
                      ? 'primary'
                      : 'secondary'
                }
                ctaIcon={tier.contactOnly ? 'whatsapp' : 'arrow'}
              />
            ))}
          </div>

          {/* Grid Utilitário 2x2 no Mobile de Garantias de Valor */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-1 text-xs text-slate-300">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px] truncate">Pix imediato ou Cartão 12x</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px] truncate">Liberação automática imediata</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px] truncate">Créditos nunca expiram</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <span className="text-[11px] truncate">Devolução em caso de falha</span>
            </div>
          </div>

          {/* Nota de Rodapé com Links */}
          <div className="relative z-10 pt-2 text-center border-t border-white/5">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
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

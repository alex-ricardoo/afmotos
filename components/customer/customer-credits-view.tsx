'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Coins,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Zap,
  TrendingDown,
  History,
  HelpCircle,
  Car,
  ChevronDown,
  Layers,
  Percent,
  Check,
  Smartphone,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MercadoPagoBrandIcon } from '@/components/customer/payment-brand-icons';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import type { CreditPackageOffer } from '@/lib/credits/types';
import { cn } from '@/lib/utils';

export interface LedgerItem {
  id: string;
  created_at: string;
  entry_type?: string;
  transaction_type?: string;
  quantity?: number;
  amount?: number;
  available_effect?: number;
  reason_code?: string;
  reason_note?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface CustomerCreditsViewProps {
  balance: number;
  regularConsultationPrice?: number;
  userEmail: string;
  userName: string;
  whatsappPhone: string;
  ledgerHistory: LedgerItem[];
  offers?: CreditPackageOffer[];
}

/**
 * CustomerCreditsView - Painel de Créditos B2B & Lojistas
 * 
 * Refatorado com os mesmos padrões visuais premium aplicados na página de histórico:
 * 1. Paleta Dark Mode: Carvão profundo (bg-slate-950), superfícies bg-slate-900/80, bordas border-white/5 e backdrop-blur-sm.
 * 2. Hierarquia e Tipografia: Títulos fortes (text-2xl / text-4xl font-bold text-slate-50), textos de apoio (text-slate-400).
 * 3. Destaques Bronze/Dourado: Elementos de atenção e valor (text-amber-500, border-amber-500/30, bg-amber-500/10).
 * 4. Botões de Alta Conversão: Azul primário de checkout Mercado Pago e verde esmeralda para suporte WhatsApp.
 * 5. Micro-interações e Feedback Tátil: active:scale-[0.98] transition-transform em todos os botões de ação.
 */
export function CustomerCreditsView({
  balance,
  regularConsultationPrice,
  userEmail,
  userName,
  whatsappPhone,
  ledgerHistory,
  offers = [],
}: CustomerCreditsViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [buyingOfferId, setBuyingOfferId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [simulatedCount, setSimulatedCount] = useState<number>(() => {
    if (offers.length > 0) {
      const highlight = offers.find((o) => o.highlight);
      if (highlight) return highlight.credits_quantity;
      if (offers[1]) return offers[1].credits_quantity;
      return offers[0].credits_quantity;
    }
    return 15;
  });

  const cleanPhone = whatsappPhone.replace(/\D/g, '') || '81999999999';

  // Preço base oficial da consulta avulsa configurado dinamicamente no banco de dados (site_settings)
  const basePrice =
    typeof regularConsultationPrice === 'number' && regularConsultationPrice > 0
      ? regularConsultationPrice
      : 39.99;

  // Custo mínimo da API Brasil (R$ 30,00). Travamos piso para nunca vender abaixo de R$ 30,00.
  const APIBRASIL_FLOOR_COST = 30.0;

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Percentuais de desconto fixos: 5%, 8%, 12% e 15%
  const DISCOUNT_TIERS = {
    starter: 0.05, // 5% OFF
    pro: 0.08, // 8% OFF
    business: 0.12, // 12% OFF
    enterprise: 0.15, // 15% OFF
  };

  // Valores unitários calculados sobre o preço oficial do banco, com lucro garantido
  const starterUnit = Math.max(
    APIBRASIL_FLOOR_COST + 1.0,
    Math.round(basePrice * (1 - DISCOUNT_TIERS.starter) * 100) / 100,
  );
  const proUnit = Math.max(
    APIBRASIL_FLOOR_COST + 1.0,
    Math.round(basePrice * (1 - DISCOUNT_TIERS.pro) * 100) / 100,
  );
  const businessUnit = Math.max(
    APIBRASIL_FLOOR_COST + 1.0,
    Math.round(basePrice * (1 - DISCOUNT_TIERS.business) * 100) / 100,
  );
  const enterpriseUnit = Math.max(
    APIBRASIL_FLOOR_COST + 1.0,
    Math.round(basePrice * (1 - DISCOUNT_TIERS.enterprise) * 100) / 100,
  );

  const handleBuyWithMercadoPago = async (offerId: string) => {
    try {
      setBuyingOfferId(offerId);
      setCheckoutError(null);

      const idempotencyKey = crypto.randomUUID();
      const res = await fetch(`/api/cliente/credit-packages/${offerId}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idempotencyKey }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.redirectUrl) {
        throw new Error(data.error || 'Não foi possível iniciar o checkout do pacote.');
      }

      if (typeof window !== 'undefined') {
        window.location.assign(data.redirectUrl);
      }
    } catch (err) {
      console.error('[handleBuyWithMercadoPago] Erro:', err);
      setCheckoutError(
        err instanceof Error ? err.message : 'Erro inesperado ao conectar com o Mercado Pago.',
      );
      setBuyingOfferId(null);
    }
  };

  // Pacotes comerciais dinâmicos baseados no catálogo oficial do banco
  const packages =
    offers.length > 0
      ? offers.map((off) => {
          const isWaOnly = off.contact_only || off.requires_whatsapp;
          const unitVal =
            off.credits_quantity > 0 ? off.price_cents / off.credits_quantity / 100 : 0;
          const totalPrice = off.price_cents / 100;

          const savingsPercent = isWaOnly
            ? 'Sob Medida'
            : off.discount_percent && off.discount_percent > 0
              ? `${Math.round(off.discount_percent)}% OFF`
              : null;

          const defaultTagline = isWaOnly
            ? 'Condições especiais para concessionárias, frotas e revendas de grande porte.'
            : off.credits_quantity >= 30
              ? 'Máxima produtividade para alta rotatividade de veículos.'
              : off.credits_quantity >= 15
                ? 'O preferido de revendas, lojistas e corretores de motos.'
                : 'Ideal para avaliações pontuais com economia comprovada.';

          const defaultPerks = isWaOnly
            ? [
                'Volume a partir de 50 consultas',
                'Faturamento PJ via boleto bancário',
                'Atendimento comercial prioritário no WhatsApp',
              ]
            : [
                `${off.credits_quantity} laudos veiculares completos`,
                'Liberação imediata no Mercado Pago',
                'Créditos vitalícios sem data de expiração',
              ];

          const isPopular = Boolean(
            off.highlight || off.is_featured || off.credits_quantity === 15,
          );

          return {
            id: off.id,
            name: off.name,
            quantity: isWaOnly ? `${off.credits_quantity}+` : off.credits_quantity,
            badge: off.badge,
            tagline: off.tagline || defaultTagline,
            estimatedUnitPrice: isWaOnly ? 'Sob consulta' : formatCurrency(unitVal),
            totalPriceFormatted: isWaOnly ? 'Sob consulta' : formatCurrency(totalPrice),
            savingsPercent,
            perks: off.perks && off.perks.length > 0 ? off.perks.slice(0, 3) : defaultPerks,
            highlight: isPopular,
            contactOnly: isWaOnly,
            whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e gostaria de cotação para o pacote de ${off.credits_quantity}+ créditos veiculares na AF Motos.`,
          };
        })
      : [
          {
            id: 'starter',
            name: 'Pacote Inicial',
            quantity: 5,
            badge: null,
            tagline: 'Ideal para avaliações pontuais com economia comprovada.',
            estimatedUnitPrice: formatCurrency(starterUnit),
            totalPriceFormatted: formatCurrency(5 * starterUnit),
            savingsPercent: '5% OFF',
            perks: [
              '5 laudos veiculares completos',
              'Liberação imediata no sistema',
              'Créditos sem data de validade',
            ],
            highlight: false,
            contactOnly: false,
            whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e gostaria de fechar o Pacote Inicial de 5 créditos de consultas veiculares na AF Motos.`,
          },
          {
            id: 'pro',
            name: 'Pacote Lojista & Revenda',
            quantity: 15,
            badge: 'Mais Vendido',
            tagline: 'O preferido de revendas, lojistas e corretores de motos.',
            estimatedUnitPrice: formatCurrency(proUnit),
            totalPriceFormatted: formatCurrency(15 * proUnit),
            savingsPercent: '8% OFF',
            perks: [
              '15 laudos veiculares completos',
              'Maior economia por consulta',
              'Prioridade no processamento',
            ],
            highlight: true,
            contactOnly: false,
            whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e quero ativar o Pacote Lojista de 15 créditos com desconto especial da AF Motos.`,
          },
          {
            id: 'business',
            name: 'Pacote Frotista & Despachante',
            quantity: 30,
            badge: 'Custo-Benefício',
            tagline: 'Máxima produtividade para alta rotatividade de veículos.',
            estimatedUnitPrice: formatCurrency(businessUnit),
            totalPriceFormatted: formatCurrency(30 * businessUnit),
            savingsPercent: '12% OFF',
            perks: [
              '30 laudos veiculares completos',
              'Menor custo por placa consultada',
              'Suporte dedicado no WhatsApp',
            ],
            highlight: false,
            contactOnly: false,
            whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e gostaria de negociar o Pacote Business de 30 créditos veiculares.`,
          },
          {
            id: 'enterprise',
            name: 'Volume Customizado',
            quantity: '50+',
            badge: 'Corporativo',
            tagline: 'Condições especiais para concessionárias e frotas.',
            estimatedUnitPrice: formatCurrency(enterpriseUnit),
            totalPriceFormatted: 'Sob consulta',
            savingsPercent: 'Sob Medida',
            perks: [
              'Volume a partir de 50 consultas',
              'Faturamento PJ ou Pix direto',
              'Atendimento comercial VIP',
            ],
            highlight: false,
            contactOnly: true,
            whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e represento uma empresa com alta demanda (+50 consultas). Gostaria de uma cotação personalizada.`,
          },
        ];

  // Configuração dinâmica do Simulador B2B
  const simulatorTiers = React.useMemo(() => {
    if (offers && offers.length > 0) {
      const sorted = [...offers].sort((a, b) => a.credits_quantity - b.credits_quantity);
      return sorted.map((off) => {
        const isWa = off.contact_only || off.requires_whatsapp;
        const pkgTotal = off.price_cents / 100;
        const qty = off.credits_quantity;
        const unitVal = qty > 0 ? pkgTotal / qty : 0;
        const discountPct =
          off.discount_percent && off.discount_percent > 0
            ? Math.round(off.discount_percent)
            : 0;

        return {
          id: off.id,
          quantity: qty,
          label: isWa ? `${qty}+` : `${qty}`,
          name: off.name,
          pkgUnitPrice: unitVal,
          packageTotal: pkgTotal,
          discountPercent: discountPct,
          isWaOnly: isWa,
        };
      });
    }

    return [
      {
        id: 'tier-5',
        quantity: 5,
        label: '5',
        name: 'Pacote Inicial',
        pkgUnitPrice: starterUnit,
        packageTotal: 5 * starterUnit,
        discountPercent: 5,
        isWaOnly: false,
      },
      {
        id: 'tier-15',
        quantity: 15,
        label: '15',
        name: 'Pacote Lojista & Revenda',
        pkgUnitPrice: proUnit,
        packageTotal: 15 * proUnit,
        discountPercent: 8,
        isWaOnly: false,
      },
      {
        id: 'tier-30',
        quantity: 30,
        label: '30',
        name: 'Pacote Frotista & Despachante',
        pkgUnitPrice: businessUnit,
        packageTotal: 30 * businessUnit,
        discountPercent: 12,
        isWaOnly: false,
      },
      {
        id: 'tier-50',
        quantity: 50,
        label: '50+',
        name: 'Volume Customizado',
        pkgUnitPrice: enterpriseUnit,
        packageTotal: 50 * enterpriseUnit,
        discountPercent: 15,
        isWaOnly: true,
      },
    ];
  }, [offers, starterUnit, proUnit, businessUnit, enterpriseUnit]);

  // Pacote ativo no simulador
  const activeSimulatorTier =
    simulatorTiers.find((t) => t.quantity === simulatedCount) ||
    simulatorTiers[1] ||
    simulatorTiers[0];

  // Filtro de Extrato
  const filteredLedger = ledgerHistory.filter((item) => {
    const type = item.entry_type || item.transaction_type || '';
    const isPositive = ['grant', 'granted', 'release', 'released', 'adjustment_add'].includes(type);

    if (filterType === 'in') return isPositive;
    if (filterType === 'out') return !isPositive;
    return true;
  });

  const faqs = [
    {
      q: 'Quando meus créditos caem na conta após o pagamento?',
      a: 'Cai na hora! Assim que você conclui o pagamento pelo Mercado Pago (seja por Pix ou cartão de crédito), seus créditos entram automaticamente no seu saldo em poucos segundos. Não precisa enviar comprovante nem esperar ninguém aprovar. Se você comprou o pacote de mais de 50 consultas pelo WhatsApp, nossa equipe libera seus créditos assim que o pagamento for confirmado.',
    },
    {
      q: 'E se a consulta falhar ou a placa não for encontrada? Eu perco o crédito?',
      a: 'Não, você nunca sai no prejuízo! O seu crédito só é descontado se o relatório completo do veículo for gerado com sucesso. Se o sistema do Detran estiver fora do ar ou acontecer qualquer erro na busca, o seu crédito volta na mesma hora para o seu saldo.',
    },
    {
      q: 'Os créditos têm prazo de validade? Eles vencem?',
      a: 'Não vencem nunca! Os créditos comprados são seus para sempre. Você pode usar um hoje, outro daqui a três meses ou no ano que vem, no seu próprio ritmo.',
    },
    {
      q: 'Como eu uso os créditos para consultar uma placa?',
      a: 'É muito fácil: vá em "Nova Consulta", digite a placa do carro ou da moto e clique em continuar. O sistema vai reconhecer que você tem saldo e mostrará um botão para usar 1 crédito. Ao clicar nele, o laudo abre na tela na hora, sem você precisar passar cartão nem fazer Pix novamente.',
    },
    {
      q: 'Posso parcelar a compra dos pacotes no cartão?',
      a: 'Sim! Você pode pagar à vista no Pix ou parcelar no cartão de crédito em até 12 vezes direto no Mercado Pago, com total segurança e aprovação rápida.',
    },
    {
      q: 'Como funciona para quem precisa de muitas consultas (mais de 50)?',
      a: 'Se você tem loja, revenda, frota de veículos ou faz muitas consultas por mês, nós montamos um pacote sob medida com desconto ainda maior. É só clicar no botão de WhatsApp do pacote corporativo e conversar direto com a nossa equipe.',
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-12 pb-20 max-w-6xl mx-auto px-4 sm:px-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HERO & SALDO - MOBILE FIRST PREMIUM                        */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 lg:p-10 shadow-xl shadow-black/40">
        {/* Glow sutil de fundo */}
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-24 left-1/4 w-60 h-60 bg-blue-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Informações Principais */}
          <div className="space-y-3 sm:space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent text-amber-400 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Créditos Pré-Pagos • Mercado Pago Oficial</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-50 tracking-tight leading-tight font-heading">
              Consultas Veiculares Instantâneas sem Fila de Pagamento
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
              Compre pacotes de créditos com desconto progressivo direto pelo{' '}
              <strong className="text-slate-200">Mercado Pago</strong> (Pix imediato ou Cartão até 12x). Seus laudos são
              emitidos na hora em 1 clique, sem precisar passar pelo checkout a cada consulta.
            </p>

            {/* Micro badges de valor com padrão refinado */}
            <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/5">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Liberação instantânea
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Créditos nunca expiram
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                Devolução se falhar
              </span>
            </div>
          </div>

          {/* Card de Saldo Atual - Destaque em Vidro */}
          <div className="w-full lg:w-80 shrink-0 p-6 sm:p-7 rounded-3xl bg-slate-950/70 border border-amber-500/30 shadow-xl shadow-amber-950/20 backdrop-blur-md flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Seu Saldo Atual
              </span>
            </div>

            <div className="flex items-baseline justify-center gap-2 my-1">
              <span className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                {balance}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-400">
                {balance === 1 ? 'crédito disponível' : 'créditos disponíveis'}
              </span>
            </div>

            <div className="mt-1 mb-4">
              {balance > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Pronto para consultar
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" />
                  Nenhum crédito disponível
                </span>
              )}
            </div>

            {/* Ações Rápidas no Saldo com Micro-interações */}
            <div className="w-full space-y-2.5">
              {balance > 0 ? (
                <Link href="/cliente/consultas/nova" className="block w-full">
                  <button
                    type="button"
                    className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl py-3 px-4 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98] cursor-pointer"
                  >
                    <Car className="w-4 h-4" />
                    <span>Consultar Placa Agora</span>
                  </button>
                </Link>
              ) : (
                <a href="#pacotes" className="block w-full">
                  <button
                    type="button"
                    className="w-full min-h-[48px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl py-3 px-4 shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98] cursor-pointer"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Adquirir Créditos</span>
                  </button>
                </a>
              )}

              <a href="#pacotes" className="block w-full">
                <button
                  type="button"
                  className="w-full min-h-[40px] bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl py-2.5 transition-transform duration-150 active:scale-[0.98] cursor-pointer"
                >
                  Ver Todos os Pacotes
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. COMO FUNCIONA EM 3 PASSOS RÁPIDOS                         */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div className="text-center sm:text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Processo 100% Automatizado</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-50 tracking-tight font-heading">
            Como funciona a compra e o uso dos seus créditos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 space-y-2.5 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold font-mono text-xs flex items-center justify-center">
                01
              </span>
              <Smartphone className="w-5 h-5 text-slate-500" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-50 pt-1">Escolha o Pacote Ideal</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Defina a quantidade de consultas que sua operação precisa (de 5 a mais de 50 laudos)
              com desconto progressivo por volume.
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 space-y-2.5 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold font-mono text-xs flex items-center justify-center">
                02
              </span>
              <ShieldCheck className="w-5 h-5 text-slate-500" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-50 pt-1">Pagamento Online Instantâneo</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Pague com total segurança no Mercado Pago (Pix imediato ou Cartão em até 12x). Os
              créditos entram automaticamente no seu saldo!
            </p>
          </div>

          <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 space-y-2.5 shadow-xl shadow-black/30">
            <div className="flex items-center justify-between">
              <span className="w-9 h-9 rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-400 font-bold font-mono text-xs flex items-center justify-center">
                03
              </span>
              <Zap className="w-5 h-5 text-slate-500" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-50 pt-1">Consulte em 1 Toque</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Digite qualquer placa e emita laudos oficiais completos em 1 clique, sem burocracia
              nem digitação de cartão a cada consulta.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. GRADE DE PACOTES COMERCIAIS (DESIGN SÊNIOR MOBILE FIRST)  */}
      {/* ------------------------------------------------------------- */}
      <div id="pacotes" className="space-y-6 sm:space-y-8 scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-400">
            <Percent className="w-3.5 h-3.5 text-amber-400" />
            <span>Catálogo Oficial • Mercado Pago & Desconto Progressivo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-50 tracking-tight font-heading">
            Escolha seu Pacote de Créditos
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
            Créditos sem data de expiração. Pagamento seguro com liberação automática instantânea
            via Mercado Pago ou atendimento corporativo para demandas acima de 50 consultas.
          </p>

          {/* Micro badges de garantia */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Ambiente Mercado Pago
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-white/5">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Pix Instantâneo ou Cartão até 12x
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-white/5">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              Créditos Nunca Expiram
            </span>
          </div>
        </div>

        {/* Feedback de erro de checkout */}
        {checkoutError && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-200 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs space-y-1">
              <p className="font-bold">Não foi possível iniciar o pagamento:</p>
              <p>{checkoutError}</p>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-bold cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Grade de Pacotes Responsiva com Estética Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {packages.map((pkg) => {
            const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(pkg.whatsappMessage)}`;

            return (
              <div
                key={pkg.id}
                className={cn(
                  'relative flex flex-col justify-between p-5 sm:p-6 lg:p-4.5 xl:p-5 2xl:p-6 rounded-3xl transition-all duration-300',
                  'bg-slate-900/80 backdrop-blur-sm border shadow-xl shadow-black/40',
                  pkg.highlight
                    ? 'border-blue-500/50 ring-1 ring-blue-500/60 shadow-blue-950/30 lg:-translate-y-1'
                    : 'border-white/5 hover:border-white/15',
                )}
              >
                {/* Tag MAIS POPULAR Flutuante */}
                {pkg.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                    <span className="inline-flex items-center gap-1 px-3.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md shadow-blue-900/50 border border-blue-400/30">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>MAIS POPULAR</span>
                    </span>
                  </div>
                )}

                <div className="space-y-3.5 sm:space-y-4">
                  {/* Topo do Card: Selo de Desconto */}
                  <div className="flex items-center justify-between min-h-[26px]">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                      {pkg.badge || (pkg.contactOnly ? 'Corporativo' : 'Pacote Oficial')}
                    </span>
                    {pkg.savingsPercent && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {pkg.savingsPercent}
                      </span>
                    )}
                  </div>

                  {/* Nome do Pacote e Tagline */}
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl lg:text-lg xl:text-xl font-bold text-slate-50 tracking-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Seção de Preço e Volume */}
                  <div className="py-3 px-3.5 sm:px-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl lg:text-2xl font-black text-white tracking-tight">
                        {pkg.quantity}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        {typeof pkg.quantity === 'number' && pkg.quantity === 1 ? 'consulta' : 'consultas'}
                      </span>
                    </div>

                    <div>
                      <div
                        className={cn(
                          'font-black tracking-tight leading-tight',
                          pkg.contactOnly
                            ? 'text-xl sm:text-2xl lg:text-xl text-emerald-400'
                            : 'text-2xl sm:text-3xl lg:text-[21px] xl:text-2xl text-white',
                        )}
                      >
                        {pkg.totalPriceFormatted}
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {pkg.contactOnly
                          ? 'Condições sob medida PJ'
                          : 'Pix imediato ou até 12x no cartão'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      {pkg.contactOnly ? (
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          Faturamento personalizado
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-xs sm:text-sm lg:text-xs xl:text-sm text-slate-200">
                            {pkg.estimatedUnitPrice}
                          </span>
                          <span className="text-slate-400 text-[10px] sm:text-[11px]">/unidade</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefícios / Perks */}
                  <div className="space-y-2 pt-1">
                    <ul className="space-y-2 text-xs text-slate-300">
                      {pkg.perks.map((perk: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-snug text-slate-300">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Botão de Ação com Feedback Tátil */}
                <div className="pt-5 space-y-2">
                  {pkg.contactOnly ? (
                    <div className="space-y-1.5">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                      >
                        <button
                          type="button"
                          className="w-full min-h-[48px] text-xs sm:text-sm font-semibold text-white rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                          <WhatsAppIcon className="h-4 w-4 fill-current text-white shrink-0" />
                          <span>Falar no WhatsApp</span>
                        </button>
                      </a>
                      <p className="text-center text-[10px] text-slate-500">
                        Cotação e faturamento sob medida
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleBuyWithMercadoPago(pkg.id)}
                        disabled={Boolean(buyingOfferId)}
                        className={cn(
                          'w-full min-h-[48px] text-xs sm:text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
                          pkg.highlight
                            ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-lg shadow-blue-900/40'
                            : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-white/10 text-slate-100',
                        )}
                      >
                        {buyingOfferId === pkg.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-white" />
                            <span>Iniciando...</span>
                          </>
                        ) : (
                          <>
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#009ee3] shrink-0">
                              <MercadoPagoBrandIcon className="h-3 w-3 text-[#009ee3]" />
                            </div>
                            <span>Comprar Pacote</span>
                            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                          </>
                        )}
                      </button>

                      <div className="text-center text-[10px] text-slate-500 pt-0.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-amber-400 transition-colors"
                        >
                          Dúvidas? Fale no WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. SIMULADOR DE PACOTES E VOLUME                              */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 space-y-5 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-50">Simulador de Pacotes & Volume</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Consulte o investimento total e o custo por laudo de acordo com a demanda da sua operação.
            </p>
          </div>

          {/* Seletores rápidos de volume */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/5 self-start sm:self-auto">
            {simulatorTiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSimulatedCount(tier.quantity)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-[0.98]',
                  activeSimulatorTier.quantity === tier.quantity
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200',
                )}
              >
                {tier.label} un
              </button>
            ))}
          </div>
        </div>

        {/* Métricas do Simulador */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
          {/* Card 1: Volume Selecionado */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">
              Volume Selecionado
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {activeSimulatorTier.label} consultas
            </div>
            <span className="text-[11px] text-slate-500">
              Créditos vitalícios sem data de expiração
            </span>
          </div>

          {/* Card 2: Valor no Pacote */}
          <div className="p-5 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-400">
              Investimento Total ({activeSimulatorTier.name})
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {activeSimulatorTier.isWaOnly
                ? 'Sob Consulta'
                : formatCurrency(activeSimulatorTier.packageTotal)}
            </div>
            <span className="text-[11px] text-emerald-500 font-medium">
              {activeSimulatorTier.isWaOnly
                ? 'Condição personalizada via WhatsApp'
                : 'À vista no Pix ou até 12x no cartão'}
            </span>
          </div>

          {/* Card 3: Custo por Consulta */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 space-y-1">
            <span className="text-[11px] font-bold text-amber-400">Custo por Consulta</span>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              {activeSimulatorTier.isWaOnly
                ? 'Sob Medida'
                : `${formatCurrency(activeSimulatorTier.pkgUnitPrice)}/un`}
            </div>
            <span className="text-[11px] text-slate-400">
              {activeSimulatorTier.isWaOnly
                ? 'Condição diferenciada para frotas e lojistas'
                : activeSimulatorTier.discountPercent > 0
                  ? `${activeSimulatorTier.discountPercent}% de desconto aplicado no pacote`
                  : 'Economia progressiva garantida no lote'}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. EXTRATO DE CRÉDITOS - MOBILE FIRST COM CARDS & TABLE      */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 space-y-5 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-950/80 border border-white/5 flex items-center justify-center text-slate-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-50">Extrato de Movimentações</h2>
              <p className="text-xs text-slate-400">
                Histórico de pacotes adquiridos no Mercado Pago, consultas realizadas e estornos.
              </p>
            </div>
          </div>

          {/* Filtros de Entrada/Saída */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-white/5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                filterType === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              Todas ({ledgerHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('in')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                filterType === 'in'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              Entradas (+)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('out')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                filterType === 'out'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200',
              )}
            >
              Consultas (-)
            </button>
          </div>
        </div>

        {/* Lista Vazia */}
        {filteredLedger.length === 0 ? (
          <div className="text-center py-10 sm:py-14 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-center text-slate-500 mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-50">Nenhum lançamento no extrato</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filterType === 'all'
                  ? 'Você ainda não possui créditos concedidos ou utilizados.'
                  : 'Nenhum lançamento encontrado para o filtro selecionado.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Visualização Mobile: Cards Elegantes e Compactos */}
            <div className="block sm:hidden space-y-2.5">
              {filteredLedger.map((item) => {
                const type = item.entry_type || item.transaction_type || '';
                const isPositive = [
                  'grant',
                  'granted',
                  'release',
                  'released',
                  'adjustment_add',
                ].includes(type);
                const qty = item.quantity || item.amount || 1;
                const formattedDate = new Date(item.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${
                            isPositive
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : type === 'reserve' || type === 'reserved'
                                ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {type === 'grant' || type === 'granted'
                            ? 'Créditos Adicionados'
                            : type === 'consume' || type === 'consumed'
                              ? 'Consulta Realizada'
                              : type === 'release' || type === 'released'
                                ? 'Crédito Devolvido'
                                : type === 'reserve' || type === 'reserved'
                                  ? 'Reserva em Processo'
                                  : type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{formattedDate}</span>
                      </div>
                      <p className="text-xs text-slate-300 truncate">
                        {item.reason_note || item.description || 'Consulta veicular via crédito'}
                      </p>
                    </div>

                    <div
                      className={`text-base font-black font-mono shrink-0 ${
                        isPositive ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {isPositive ? `+${qty}` : `-${qty}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visualização Desktop: Tabela Ampla e Polida */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Data e Hora</th>
                    <th className="py-3 px-3">Tipo do Evento</th>
                    <th className="py-3 px-3">Quantidade</th>
                    <th className="py-3 px-3">Descrição / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {filteredLedger.map((item) => {
                    const type = item.entry_type || item.transaction_type || '';
                    const isPositive = [
                      'grant',
                      'granted',
                      'release',
                      'released',
                      'adjustment_add',
                    ].includes(type);
                    const qty = item.quantity || item.amount || 1;

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(item.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide border ${
                              isPositive
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : type === 'reserve' || type === 'reserved'
                                  ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {type === 'grant' || type === 'granted'
                              ? 'Créditos Adicionados'
                              : type === 'consume' || type === 'consumed'
                                ? 'Consulta Realizada'
                                : type === 'release' || type === 'released'
                                  ? 'Crédito Devolvido'
                                  : type === 'reserve' || type === 'reserved'
                                    ? 'Reserva em Processo'
                                    : type}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-sm">
                          <span className={isPositive ? 'text-emerald-400' : 'text-slate-300'}>
                            {isPositive ? `+${qty}` : `-${qty}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-[320px] truncate">
                          {item.reason_note || item.description || 'Consulta veicular via crédito'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. PERGUNTAS FREQUENTES (ACORDEÃO LIMPO)                      */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/80 backdrop-blur-sm p-6 sm:p-8 space-y-4 shadow-xl shadow-black/40">
        <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
          <HelpCircle className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-50">Dúvidas Frequentes sobre Créditos</h2>
        </div>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className={cn(
                  'rounded-2xl border transition-all duration-300 overflow-hidden',
                  'bg-slate-950/60 shadow-md',
                  isOpen
                    ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'border-white/5 hover:border-white/10',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="w-full min-h-[52px] p-4 sm:p-5 flex items-center justify-between text-left gap-4 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                    {faq.q}
                  </span>
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300',
                      isOpen
                        ? 'rotate-180 bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400',
                    )}
                  >
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 7. CONTATO DIRETO COMERCIAL                                   */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 backdrop-blur-sm border border-white/5 shadow-xl shadow-black/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1 max-w-md">
          <h4 className="text-base sm:text-lg font-bold text-slate-50">
            Precisa de faturamento PJ ou volume superior a 50 laudos?
          </h4>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Nossa equipe comercial atende concessionárias, revendas, despachantes e frotistas com
            condições sob medida e faturamento corporativo.
          </p>
        </div>

        <a
          href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
            `Olá! Gostaria de conversar com a equipe sobre pacotes corporativos de consultas veiculares (+50 laudos). Meu e-mail é ${userEmail}.`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <button
            type="button"
            className="w-full sm:w-auto min-h-[48px] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl py-3 px-6 shadow-lg shadow-emerald-950/40 cursor-pointer flex items-center justify-center gap-2 transition-transform duration-150 active:scale-[0.98]"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current text-white" />
            <span>Falar com Consultor B2B</span>
          </button>
        </a>
      </div>
    </div>
  );
}

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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MercadoPagoBrandIcon } from '@/components/customer/payment-brand-icons';
import type { CreditPackageOffer } from '@/lib/credits/types';

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
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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

  // Percentuais de desconto fixos e altamente lucrativos: 5%, 8%, 12% e 15%
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

          return {
            id: off.id,
            name: off.name,
            quantity: isWaOnly ? `${off.credits_quantity}+` : off.credits_quantity,
            badge: off.badge || null,
            tagline:
              off.tagline ||
              (isWaOnly
                ? 'Condição sob medida para grandes frotas e leilões.'
                : `Para quem realiza consultas com frequência regular.`),
            estimatedUnitPrice: isWaOnly ? 'Sob consulta' : formatCurrency(unitVal),
            totalPriceFormatted: isWaOnly ? 'Sob consulta' : formatCurrency(totalPrice),
            savingsPercent,
            perks:
              off.perks && off.perks.length > 0
                ? off.perks
                : [
                    `${off.credits_quantity} laudos veiculares completos`,
                    'Liberação imediata em 1 clique',
                    'Créditos sem data de validade',
                  ],
            highlight: off.highlight,
            contactOnly: isWaOnly,
            whatsappMessage: isWaOnly
              ? `Olá! Sou ${userName} (${userEmail}) e represento uma empresa com alta demanda (+50 consultas). Gostaria de uma cotação personalizada para o pacote ${off.name}.`
              : `Olá! Sou ${userName} (${userEmail}) e gostaria de tirar dúvidas sobre o pacote ${off.name} de ${off.credits_quantity} consultas da AF Motos.`,
          };
        })
      : [
          {
            id: 'starter',
            name: 'Pacote Inicial',
            quantity: 5,
            badge: null,
            tagline: 'Ideal para avaliações pontuais com economia garantida.',
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
            badge: null,
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
            badge: null,
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
            badge: null,
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

  // Configuração dinâmica do Simulador B2B baseada 100% nas ofertas do banco
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
      {/* 1. HERO & SALDO - MOBILE FIRST EYE-CATCHER                    */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 p-5 sm:p-8 lg:p-10 shadow-2xl">
        {/* Glow ambient effects */}
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-[#c9a44c]/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -bottom-24 left-1/4 w-60 h-60 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8">
          {/* Informações Principais */}
          <div className="space-y-3 sm:space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/15 via-[#c9a44c]/20 to-amber-600/15 text-[#e3c56c] border border-[#c9a44c]/30">
              <Sparkles className="w-3.5 h-3.5 text-[#e3c56c]" />
              <span>Créditos Pré-Pagos • Pagamento Seguro Mercado Pago</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Consultas Veiculares Instantâneas sem Fila de Pagamento
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Compre pacotes de créditos com desconto progressivo direto pelo{' '}
              <strong>Mercado Pago</strong> (Pix imediato ou Cartão até 12x). Seus laudos são
              emitidos na hora em 1 clique, sem precisar passar pelo checkout a cada consulta.
            </p>

            {/* Micro badges de valor */}
            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <Zap className="w-3.5 h-3.5 text-[#c9a44c]" />
                Liberação automática instantânea
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Créditos vitalícios sem expiração
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <ShieldCheck className="w-3.5 h-3.5 text-[#009ee3]" />
                Devolução automática se falhar
              </span>
            </div>
          </div>

          {/* Card de Saldo Atual - Destaque em Vidro */}
          <div className="w-full lg:w-80 shrink-0 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-zinc-800/60 via-zinc-900/90 to-zinc-950 border border-[#c9a44c]/30 shadow-[0_0_30px_rgba(201,164,76,0.12)] flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#c9a44c]/20 border border-[#c9a44c]/40 flex items-center justify-center text-[#e3c56c]">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Seu Saldo Atual
              </span>
            </div>

            <div className="flex items-baseline justify-center gap-2 my-1">
              <span className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                {balance}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-zinc-400">
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
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 bg-zinc-800/80 px-3 py-1 rounded-full border border-zinc-700/60">
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                  Nenhum crédito disponível
                </span>
              )}
            </div>

            {/* Ações Rápidas no Saldo */}
            <div className="w-full space-y-2">
              {balance > 0 ? (
                <Link href="/cliente/consultas/nova" className="block w-full">
                  <Button
                    size="lg"
                    className="w-full bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-black text-xs sm:text-sm rounded-xl py-5 sm:py-6 shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Consultar Placa Agora
                  </Button>
                </Link>
              ) : (
                <a href="#pacotes" className="block w-full">
                  <Button
                    size="lg"
                    className="w-full bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-black text-xs sm:text-sm rounded-xl py-5 sm:py-6 shadow-md cursor-pointer transition-transform active:scale-95"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Adquirir Créditos
                  </Button>
                </a>
              )}

              <a href="#pacotes" className="block w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-zinc-900/60 hover:bg-zinc-800 border-zinc-700/70 text-zinc-300 hover:text-white text-xs rounded-xl py-4"
                >
                  Ver Todos os Pacotes
                </Button>
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
          <span className="text-[11px] font-black uppercase tracking-wider text-[#c9a44c]">
            Processo 100% Automatizado
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Como funciona a compra e o uso dos seus créditos
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-md bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
                Passo 1
              </span>
              <Smartphone className="w-5 h-5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-white pt-1">Escolha o Pacote Ideal</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Defina a quantidade de consultas que sua operação precisa (de 5 a mais de 50 laudos)
              com desconto progressivo por volume.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Passo 2
              </span>
              <ShieldCheck className="w-5 h-5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-white pt-1">Pagamento Online Instantâneo</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Pague com total segurança no Mercado Pago (Pix imediato ou Cartão em até 12x). Os
              créditos entram automaticamente no seu saldo!
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-md bg-sky-500/15 text-sky-400 border border-sky-500/30">
                Passo 3
              </span>
              <Zap className="w-5 h-5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-white pt-1">Consulte em 1 Toque</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
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
        <div className="text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-inner">
            <Percent className="w-3.5 h-3.5 text-[#c9a44c]" />
            <span>Catálogo Oficial • Preços Dinâmicos & Mercado Pago</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Escolha seu Pacote de Créditos
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl mx-auto">
            Créditos sem data de expiração. Pagamento seguro com liberação automática instantânea
            via Mercado Pago ou atendimento corporativo para demandas acima de 50 consultas.
          </p>

          {/* Micro badges de garantia */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-zinc-400">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/70 border border-zinc-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Ambiente Seguro Mercado Pago
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/70 border border-zinc-800/80">
              <Zap className="w-3.5 h-3.5 text-[#009ee3]" />
              Pix Instantâneo ou Cartão até 12x
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/70 border border-zinc-800/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a44c]" />
              Créditos Nunca Expiram
            </span>
          </div>
        </div>

        {/* Feedback de erro de checkout */}
        {checkoutError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start gap-3 shadow-lg">
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

        {/* Grade de Pacotes Responsiva com Cores Diferenciadas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {packages.map((pkg, index) => {
            const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(pkg.whatsappMessage)}`;

            // Sistema de Cores e Temas Únicos por Pacote
            const isWa =
              pkg.contactOnly ||
              (typeof pkg.quantity === 'number'
                ? pkg.quantity >= 50
                : String(pkg.quantity).includes('50')) ||
              index === 3;
            const isGold =
              !isWa &&
              (pkg.highlight ||
                (typeof pkg.quantity === 'number' && pkg.quantity >= 15 && pkg.quantity < 30) ||
                index === 1);
            const isSky =
              !isWa &&
              !isGold &&
              ((typeof pkg.quantity === 'number' && pkg.quantity >= 30 && pkg.quantity < 50) ||
                index === 2);

            const theme = isWa
              ? {
                  cardBg: 'bg-gradient-to-b from-emerald-950/25 via-zinc-950 to-zinc-950',
                  border:
                    'border-emerald-500/50 hover:border-emerald-400 shadow-[0_10px_35px_rgba(16,185,129,0.12)] hover:shadow-[0_16px_45px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/25',
                  tag: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-black',
                  priceAccent: 'text-emerald-400',
                  unitAccent: 'text-emerald-300',
                  checkBg: 'bg-emerald-500/20 text-emerald-400',
                  buttonClass:
                    'bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:via-emerald-500 hover:to-teal-600 shadow-md shadow-emerald-950/50',
                  btnIconClass: 'bg-white text-emerald-600',
                }
              : isGold
                ? {
                    cardBg: 'bg-gradient-to-b from-amber-950/30 via-zinc-950 to-zinc-950',
                    border:
                      'border-[#c9a44c] hover:border-amber-400 shadow-[0_12px_45px_rgba(201,164,76,0.18)] hover:shadow-[0_16px_55px_rgba(201,164,76,0.30)] ring-1 ring-[#c9a44c]/60 lg:-translate-y-2',
                    tag: 'bg-amber-500/20 text-[#f5d77f] border-[#c9a44c]/50 font-black',
                    priceAccent: 'text-white',
                    unitAccent: 'text-[#e3c56c]',
                    checkBg: 'bg-amber-500/20 text-[#e3c56c]',
                    buttonClass:
                      'bg-gradient-to-r from-[#009ee3] via-[#008fe3] to-[#0070ba] hover:from-[#0ab1fc] hover:via-[#009ee3] hover:to-[#007eb5] shadow-md shadow-sky-950/50',
                    btnIconClass: 'bg-white text-[#009ee3]',
                  }
                : isSky
                  ? {
                      cardBg: 'bg-gradient-to-b from-sky-950/30 via-zinc-950 to-zinc-950',
                      border:
                        'border-sky-500/50 hover:border-sky-400 shadow-[0_10px_35px_rgba(14,165,233,0.12)] hover:shadow-[0_16px_45px_rgba(14,165,233,0.22)] ring-1 ring-sky-500/25',
                      tag: 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-black',
                      priceAccent: 'text-white',
                      unitAccent: 'text-sky-300',
                      checkBg: 'bg-sky-500/20 text-sky-400',
                      buttonClass:
                        'bg-gradient-to-r from-[#009ee3] via-[#008fe3] to-[#0070ba] hover:from-[#0ab1fc] hover:via-[#009ee3] hover:to-[#007eb5] shadow-md shadow-sky-950/50',
                      btnIconClass: 'bg-white text-[#009ee3]',
                    }
                  : {
                      cardBg: 'bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950',
                      border:
                        'border-zinc-700/70 hover:border-zinc-500 shadow-lg hover:shadow-[0_12px_35px_rgba(255,255,255,0.05)] ring-1 ring-zinc-700/30',
                      tag: 'bg-zinc-800 text-zinc-200 border-zinc-700/80 font-bold',
                      priceAccent: 'text-white',
                      unitAccent: 'text-[#e3c56c]',
                      checkBg: 'bg-zinc-800 text-zinc-300',
                      buttonClass:
                        'bg-gradient-to-r from-[#009ee3] via-[#008fe3] to-[#0070ba] hover:from-[#0ab1fc] hover:via-[#009ee3] hover:to-[#007eb5] shadow-md shadow-sky-950/50',
                      btnIconClass: 'bg-white text-[#009ee3]',
                    };

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-300 ${theme.cardBg} ${theme.border}`}
              >
                <div className="space-y-4">
                  {/* Topo do Card: Somente o Selo de Desconto (Sem slugs de categoria) */}
                  <div className="flex items-center justify-end min-h-[26px]">
                    {pkg.savingsPercent ? (
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border ${theme.tag}`}
                      >
                        {pkg.savingsPercent}
                      </span>
                    ) : (
                      <span className="opacity-0 text-[11px]">-</span>
                    )}
                  </div>

                  {/* Nome do Pacote e Tagline */}
                  <div className="space-y-1">
                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {pkg.name}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 min-h-[36px]">
                      {pkg.tagline}
                    </p>
                  </div>

                  {/* Seção de Preço e Volume */}
                  <div className="py-3 px-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5">
                    {/* Linha 1: Volume de Consultas */}
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                          {pkg.quantity}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          consultas
                        </span>
                      </div>
                    </div>

                    {/* Linha 2: Preço Total */}
                    <div>
                      <div
                        className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.priceAccent}`}
                      >
                        {pkg.totalPriceFormatted}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {pkg.contactOnly
                          ? 'Condições personalizadas para sua empresa'
                          : 'à vista no Pix ou até 12x no cartão'}
                      </p>
                    </div>

                    {/* Linha 3: Valor por Unidade */}
                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                      {pkg.contactOnly ? (
                        <span className="text-[11px] text-zinc-400">
                          Preço diferenciado por volume
                        </span>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className={`font-extrabold text-xs sm:text-sm ${theme.unitAccent}`}>
                            {pkg.estimatedUnitPrice}
                          </span>
                          <span className="text-zinc-400 text-[11px]">/unidade</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Benefícios / Perks */}
                  <div className="space-y-2 pt-1">
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {pkg.perks.map((perk: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${theme.checkBg}`}
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <span className="leading-tight text-zinc-300">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Botão de Ação */}
                <div className="pt-5 space-y-2">
                  {pkg.contactOnly ? (
                    <div className="space-y-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full"
                      >
                        <Button
                          type="button"
                          className={`w-full h-11 sm:h-12 text-xs sm:text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer transition-all ${theme.buttonClass}`}
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${theme.btnIconClass}`}
                          >
                            <MessageCircle className="h-3 w-3 fill-current" />
                          </div>
                          <span className="font-black">WhatsApp</span>
                        </Button>
                      </a>
                      <p className="text-center text-[10px] text-zinc-500">
                        Cotação e faturamento sob medida
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button
                        type="button"
                        onClick={() => handleBuyWithMercadoPago(pkg.id)}
                        disabled={Boolean(buyingOfferId)}
                        className={`relative overflow-hidden w-full h-11 sm:h-12 text-xs sm:text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 group active:scale-[0.98] cursor-pointer transition-all ${theme.buttonClass}`}
                      >
                        {/* Efeito sutil de brilho no hover */}
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />

                        {buyingOfferId === pkg.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin shrink-0 text-white" />
                            <span>Iniciando...</span>
                          </>
                        ) : (
                          <>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${theme.btnIconClass}`}
                            >
                              <MercadoPagoBrandIcon className="h-3 w-3" />
                            </div>
                            <span className="font-black">Comprar Pacote</span>
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1 pt-0.5">
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#e3c56c] transition-colors"
                        >
                          Dúvidas? WhatsApp
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
      <div className="p-5 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">Simulador de Pacotes & Volume</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Consulte o investimento total e o custo por laudo de acordo com a demanda da sua operação.
            </p>
          </div>

          {/* Seletores rápidos de volume dinâmicos mapeados dos pacotes reais do banco */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
            {simulatorTiers.map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setSimulatedCount(tier.quantity)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  activeSimulatorTier.quantity === tier.quantity
                    ? 'bg-[#c9a44c] text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tier.label} un
              </button>
            ))}
          </div>
        </div>

        {/* Métricas do Simulador */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
          {/* Card 1: Volume Selecionado */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400">
              Volume Selecionado
            </span>
            <div className="text-xl sm:text-2xl font-black text-white">
              {activeSimulatorTier.label} consultas
            </div>
            <span className="text-[10px] text-zinc-400">
              Créditos vitalícios sem data de expiração
            </span>
          </div>

          {/* Card 2: Valor no Pacote */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400">
              Investimento Total ({activeSimulatorTier.name})
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {activeSimulatorTier.isWaOnly
                ? 'Sob Consulta'
                : formatCurrency(activeSimulatorTier.packageTotal)}
            </div>
            <span className="text-[10px] text-emerald-500 font-medium">
              {activeSimulatorTier.isWaOnly
                ? 'Condição personalizada via WhatsApp'
                : 'À vista no Pix ou até 12x no cartão'}
            </span>
          </div>

          {/* Card 3: Custo por Consulta */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#c9a44c]/15 to-transparent border border-[#c9a44c]/30 space-y-1">
            <span className="text-[11px] font-bold text-[#e3c56c]">Custo por Consulta</span>
            <div className="text-xl sm:text-2xl font-black text-[#e3c56c]">
              {activeSimulatorTier.isWaOnly
                ? 'Sob Medida'
                : `${formatCurrency(activeSimulatorTier.pkgUnitPrice)}/un`}
            </div>
            <span className="text-[10px] text-zinc-400">
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
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950 p-5 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl  flex items-center justify-center text-zinc-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Extrato de Movimentações</h2>
              <p className="text-xs text-zinc-400">
                Histórico de pacotes adquiridos no Mercado Pago, consultas realizadas e estornos.
              </p>
            </div>
          </div>

          {/* Filtros de Entrada/Saída */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas ({ledgerHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('in')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'in'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Entradas (+)
            </button>
            <button
              type="button"
              onClick={() => setFilterType('out')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterType === 'out'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Consultas (-)
            </button>
          </div>
        </div>

        {/* Lista Vazia */}
        {filteredLedger.length === 0 ? (
          <div className="text-center py-10 sm:py-14 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Nenhum lançamento no extrato</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
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
                    className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3"
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
                        <span className="text-[10px] text-zinc-500 font-mono">{formattedDate}</span>
                      </div>
                      <p className="text-xs text-zinc-300 truncate">
                        {item.reason_note || item.description || 'Consulta veicular via crédito'}
                      </p>
                    </div>

                    <div
                      className={`text-base font-black font-mono shrink-0 ${
                        isPositive ? 'text-emerald-400' : 'text-zinc-300'
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
                  <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Data e Hora</th>
                    <th className="py-3 px-3">Tipo do Evento</th>
                    <th className="py-3 px-3">Quantidade</th>
                    <th className="py-3 px-3">Descrição / Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
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
                      <tr key={item.id} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
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
                          <span className={isPositive ? 'text-emerald-400' : 'text-zinc-300'}>
                            {isPositive ? `+${qty}` : `-${qty}`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-zinc-400 max-w-[320px] truncate">
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
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950 p-5 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-4">
          <HelpCircle className="w-5 h-5 text-[#c9a44c]" />
          <h2 className="text-lg font-bold text-white">Dúvidas Frequentes sobre Créditos</h2>
        </div>

        <div className="divide-y divide-zinc-900">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div key={index} className="py-3 sm:py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between text-left gap-3 group cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-[#c9a44c]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="mt-2.5 text-xs text-zinc-400 leading-relaxed pl-1 pr-4 animate-in fade-in-50 duration-200">
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
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="space-y-1 max-w-md">
          <h4 className="text-base font-bold text-white">
            Precisa de faturamento PJ ou volume superior a 50 laudos?
          </h4>
          <p className="text-xs text-zinc-400">
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
          <Button
            size="lg"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl py-5 px-6 shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar com Consultor B2B</span>
          </Button>
        </a>
      </div>
    </div>
  );
}

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
  Clock,
  ArrowRight,
  History,
  HelpCircle,
  Car,
  ChevronDown,
  Layers,
  Percent,
  Check,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  regularConsultationPrice = 39.9,
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
  const [simulatedCount, setSimulatedCount] = useState<number>(15);

  const cleanPhone = whatsappPhone.replace(/\D/g, '') || '81999999999';

  // Preço base dinâmico vindo da tabela site_settings no banco de dados (ex: R$ 39,99)
  const basePrice = regularConsultationPrice > 0 ? regularConsultationPrice : 39.99;

  // Custo mínimo da API Brasil (R$ 30,00). Travamos piso para nunca vender abaixo de R$ 30,00.
  const APIBRASIL_FLOOR_COST = 30.00;

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Percentuais de desconto fixos e altamente lucrativos: 5%, 8%, 12% e 15%
  const DISCOUNT_TIERS = {
    starter: 0.05,     // 5% OFF
    pro: 0.08,         // 8% OFF
    business: 0.12,    // 12% OFF
    enterprise: 0.15,  // 15% OFF
  };

  // Valores unitários calculados sobre o preço oficial do banco, com lucro garantido
  const starterUnit = Math.max(APIBRASIL_FLOOR_COST + 1.0, Math.round(basePrice * (1 - DISCOUNT_TIERS.starter) * 100) / 100);
  const proUnit = Math.max(APIBRASIL_FLOOR_COST + 1.0, Math.round(basePrice * (1 - DISCOUNT_TIERS.pro) * 100) / 100);
  const businessUnit = Math.max(APIBRASIL_FLOOR_COST + 1.0, Math.round(basePrice * (1 - DISCOUNT_TIERS.business) * 100) / 100);
  const enterpriseUnit = Math.max(APIBRASIL_FLOOR_COST + 1.0, Math.round(basePrice * (1 - DISCOUNT_TIERS.enterprise) * 100) / 100);

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

      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error('[handleBuyWithMercadoPago] Erro:', err);
      setCheckoutError(
        err instanceof Error ? err.message : 'Erro inesperado ao conectar com o Mercado Pago.',
      );
      setBuyingOfferId(null);
    }
  };

  // Pacotes comerciais dinâmicos baseados no catálogo oficial do banco
  const packages = offers.length > 0
    ? offers.map((off) => {
        const isWaOnly = off.contact_only || off.requires_whatsapp;
        const unitVal = off.credits_quantity > 0 ? (off.price_cents / off.credits_quantity) / 100 : 0;
        const refVal = (off.reference_individual_price_cents || 3990) / 100;
        const totalPrice = off.price_cents / 100;

        return {
          id: off.id,
          name: off.name,
          quantity: isWaOnly ? `${off.credits_quantity}+` : off.credits_quantity,
          badge: off.badge || (isWaOnly ? 'Sob Medida PJ' : off.credits_quantity >= 30 ? 'Melhor Custo-Benefício' : off.credits_quantity >= 15 ? 'Mais Recomendado' : 'Autônomo'),
          tagline: off.tagline || (isWaOnly ? 'Condição sob medida para leilões, concessionárias e grandes frotas.' : `Pacote comercial com ${off.credits_quantity} consultas veiculares.`),
          estimatedUnitPrice: formatCurrency(unitVal),
          regularUnitPrice: formatCurrency(refVal),
          totalPriceFormatted: isWaOnly ? 'Sob consulta' : formatCurrency(totalPrice),
          savingsPercent: off.discount_percent ? `${off.discount_percent}% OFF` : 'Especial',
          perks: off.perks && off.perks.length > 0 ? off.perks : [
            `${off.credits_quantity} laudos veiculares completos`,
            'Liberação imediata em 1 clique',
            'Sem taxa de cartão a cada placa',
            'Créditos sem data de expiração',
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
          badge: 'Autônomo',
          tagline: 'Ideal para quem compra ou vende veículos com frequência moderada.',
          estimatedUnitPrice: formatCurrency(starterUnit),
          regularUnitPrice: formatCurrency(basePrice),
          totalPriceFormatted: formatCurrency(5 * starterUnit),
          savingsPercent: '5% OFF',
          perks: [
            '5 laudos veiculares completos',
            'Liberação imediata em 1 clique',
            'Sem taxa de cartão a cada placa',
            'Créditos sem data de expiração',
          ],
          highlight: false,
          contactOnly: false,
          whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e gostaria de fechar o Pacote Inicial de 5 créditos de consultas veiculares na AF Motos.`,
        },
        {
          id: 'pro',
          name: 'Pacote Lojista & Revenda',
          quantity: 15,
          badge: 'Mais Recomendado',
          tagline: 'O pacote preferido de lojistas de motos, corretores e revendas.',
          estimatedUnitPrice: formatCurrency(proUnit),
          regularUnitPrice: formatCurrency(basePrice),
          totalPriceFormatted: formatCurrency(15 * proUnit),
          savingsPercent: '8% OFF',
          perks: [
            '15 laudos veiculares completos',
            'Economia progressiva garantida',
            'Prioridade na fila de processamento',
            'Canal dedicado via WhatsApp',
          ],
          highlight: true,
          contactOnly: false,
          whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e quero ativar o Pacote Lojista de 15 créditos com desconto especial da AF Motos.`,
        },
        {
          id: 'business',
          name: 'Pacote Frotista & Despachante',
          quantity: 30,
          badge: 'Melhor Custo-Benefício',
          tagline: 'Máxima produtividade para quem avalia veículos diariamente.',
          estimatedUnitPrice: formatCurrency(businessUnit),
          regularUnitPrice: formatCurrency(basePrice),
          totalPriceFormatted: formatCurrency(30 * businessUnit),
          savingsPercent: '12% OFF',
          perks: [
            '30 laudos veiculares completos',
            'Menor custo por placa consultada',
            'Histórico e auditoria centralizados',
            'Suporte prioritário exclusivo',
            'Créditos não expiram nunca',
          ],
          highlight: false,
          contactOnly: false,
          whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e gostaria de negociar o Pacote Business de 30 créditos veiculares.`,
        },
        {
          id: 'enterprise',
          name: 'Volume Customizado',
          quantity: '50+',
          badge: 'Sob Medida PJ',
          tagline: 'Condição sob medida para leilões, concessionárias e grandes frotas.',
          estimatedUnitPrice: formatCurrency(enterpriseUnit),
          regularUnitPrice: formatCurrency(basePrice),
          totalPriceFormatted: 'Sob consulta',
          savingsPercent: '15% OFF',
          perks: [
            'Volume a partir de 50 consultas',
            'Faturamento ou PIX PJ direto',
            'Atendimento direto com a diretoria',
            'Garantia de disponibilidade SLA',
          ],
          highlight: false,
          contactOnly: true,
          whatsappMessage: `Olá! Sou ${userName} (${userEmail}) e represento uma empresa com alta demanda (+50 consultas). Gostaria de uma cotação personalizada.`,
        },
      ];

  // Cálculo dinâmico do simulador
  const simulatedUnitDiscounted =
    simulatedCount >= 50
      ? enterpriseUnit
      : simulatedCount >= 30
      ? businessUnit
      : simulatedCount >= 15
      ? proUnit
      : starterUnit;

  const regularTotal = simulatedCount * basePrice;
  const packageTotal = simulatedCount * simulatedUnitDiscounted;
  const savingsTotal = Math.max(0, regularTotal - packageTotal);

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
      q: 'Como é feita a ativação dos créditos após o pagamento?',
      a: 'Após combinar o pacote com nossa equipe no WhatsApp e concluir o pagamento (normalmente via PIX), o administrador credita o lote contratado diretamente na sua conta em questão de minutos. Seu saldo atualiza automaticamente na tela.',
    },
    {
      q: 'O que acontece se a consulta não encontrar dados ou falhar?',
      a: 'Nosso sistema conta com proteção de reserva atômica. O crédito só é consumido definitivamente se o laudo oficial for entregue com sucesso. Em caso de falha permanente da base governamental, o crédito é estornado automaticamente para o seu saldo.',
    },
    {
      q: 'Os créditos possuem prazo de validade?',
      a: 'Não. Os créditos adquiridos ficam vinculados permanentemente ao seu cadastro. Você pode usá-los hoje, no próximo mês ou ao longo de todo o ano, no ritmo do seu negócio.',
    },
    {
      q: 'Como faço para usar o crédito no momento da consulta?',
      a: 'Muito simples: acesse a tela de Nova Consulta, digite a placa do veículo e prossiga. O sistema detecta seu saldo disponível e apresenta a opção "Usar 1 Crédito da Plataforma". Ao clicar, o laudo é emitido na hora sem passar pelo Mercado Pago.',
    },
    {
      q: 'Posso transferir créditos para outra conta?',
      a: 'Os créditos são vinculados ao e-mail e CPF cadastrados. Caso você utilize uma conta corporativa com múltiplos operadores, nossa equipe pode ajustar a distribuição no momento da negociação comercial.',
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-12 pb-20 max-w-5xl mx-auto">
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
              <span>Modalidade B2B • Créditos Pré-Pagos</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Consultas Veiculares Instantâneas sem Fila de Pagamento
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Consulte histórico completo de motos, carros e caminhões em 1 clique.
              Negocie cotas com descontos progressivos direto no WhatsApp e elimine a cobrança por placa individual.
            </p>

            {/* Micro badges de valor */}
            <div className="pt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Sem validade de expiração
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <Zap className="w-3.5 h-3.5 text-[#c9a44c]" />
                Emissão em 1 clique
              </span>
            </div>
          </div>

          {/* Card de Saldo Atual - Destaque em Vidro */}
          <div className="w-full lg:w-auto shrink-0 p-5 sm:p-7 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-zinc-800/60 via-zinc-900/90 to-zinc-950 border border-[#c9a44c]/30 shadow-[0_0_30px_rgba(201,164,76,0.12)] flex flex-col items-center justify-center text-center">
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
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Comprar Créditos via WhatsApp
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
            Simplicidade Operacional
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Como funciona a contratação e o uso
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
              Defina a quantidade de consultas que sua operação precisa (de 5 a mais de 50 laudos).
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Passo 2
              </span>
              <MessageCircle className="w-5 h-5 text-zinc-500" />
            </div>
            <h3 className="text-sm font-bold text-white pt-1">Ativação no WhatsApp</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Confirme com nosso atendente comercial, pague via PIX e tenha os créditos liberados em minutos.
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
              Digite qualquer placa e emita laudos completos sem burocracia de pagamento avulso.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. GRADE DE PACOTES COMERCIAIS                                */}
      {/* ------------------------------------------------------------- */}
      <div id="pacotes" className="space-y-6 scroll-mt-24">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Percent className="w-3.5 h-3.5 text-[#c9a44c]" />
            <span>Condições Especiais com Desconto por Volume</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Escolha seu Pacote e Ative na Hora
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Preços oficiais e liberação automática via Mercado Pago Checkout Pro ou negociação sob medida.
          </p>
        </div>

        {/* Feedback de erro de checkout */}
        {checkoutError && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start gap-3">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {packages.map((pkg) => {
            const waUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(pkg.whatsappMessage)}`;

            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-3xl border transition-all duration-300 ${
                  pkg.highlight
                    ? 'bg-gradient-to-b from-[#c9a44c]/15 via-zinc-900/95 to-zinc-950 border-[#c9a44c] shadow-[0_0_30px_rgba(201,164,76,0.18)] lg:-translate-y-2'
                    : 'bg-zinc-950/80 border-zinc-800/90 hover:border-zinc-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Header do Card com Badge Não-Sobreposto */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                        pkg.highlight
                          ? 'bg-gradient-to-r from-[#e3c56c] to-[#c9a44c] text-zinc-950 shadow-sm'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
                      }`}
                    >
                      {pkg.highlight && <Sparkles className="w-3 h-3 text-zinc-950 shrink-0" />}
                      {pkg.badge}
                    </span>
                    <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {pkg.savingsPercent}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">{pkg.name}</h3>
                    <p className="text-xs text-zinc-400 leading-snug">{pkg.tagline}</p>
                  </div>

                  {/* Volume e Preço Estimado Dinâmico */}
                  <div className="py-3 px-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-black text-white">{pkg.quantity}</span>
                        <span className="text-xs font-bold text-zinc-400">consultas</span>
                      </div>
                      {pkg.totalPriceFormatted && (
                        <span className="text-xs font-black text-[#e3c56c]">
                          {pkg.totalPriceFormatted}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/50">
                      <span className="text-zinc-500 line-through">{pkg.regularUnitPrice}/un</span>
                      <span className="text-[#e3c56c] font-black">
                        {pkg.estimatedUnitPrice}/un
                      </span>
                    </div>
                  </div>

                  {/* Benefícios */}
                  <ul className="space-y-2 text-xs text-zinc-300 pt-1">
                    {pkg.perks.map((perk: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
                        <span className="leading-tight">{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Ações do Card: Mercado Pago para pacotes padrão, WhatsApp para custom */}
                <div className="pt-6 space-y-2">
                  {pkg.contactOnly ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full group"
                    >
                      <Button
                        type="button"
                        className="w-full font-black rounded-xl py-5 text-xs flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all group-hover:scale-[1.02]"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <span>Negociar no WhatsApp</span>
                      </Button>
                    </a>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={() => handleBuyWithMercadoPago(pkg.id)}
                        disabled={Boolean(buyingOfferId)}
                        className={`w-full font-black rounded-xl py-5 text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          pkg.highlight
                            ? 'bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] text-zinc-950 hover:brightness-110 shadow-md hover:scale-[1.02]'
                            : 'bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 shadow-sm hover:scale-[1.02]'
                        }`}
                      >
                        {buyingOfferId === pkg.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <span>Iniciando Checkout...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 shrink-0" />
                            <span>Comprar com Mercado Pago</span>
                          </>
                        )}
                      </Button>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-center text-[11px] text-zinc-400 hover:text-[#e3c56c] transition-colors pt-1"
                      >
                        Dúvidas? Fale no WhatsApp
                      </a>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. SIMULADOR DE ECONOMIA (DINÂMICO E VISUAL)                 */}
      {/* ------------------------------------------------------------- */}
      <div className="p-5 sm:p-8 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-black text-white">Simulador de Economia B2B</h3>
            </div>
            <p className="text-xs text-zinc-400">
              Economia calculada com base no valor dinâmico oficial de {formatCurrency(basePrice)} por consulta avulsa.
            </p>
          </div>

          {/* Seletores rápidos de volume */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
            {[5, 15, 30, 50].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setSimulatedCount(qty)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  simulatedCount === qty
                    ? 'bg-[#c9a44c] text-zinc-950 shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {qty} un
              </button>
            ))}
          </div>
        </div>

        {/* Métricas do Simulador Baseadas no Preço Dinâmico do Banco */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400">Custo Avulso Normal</span>
            <div className="text-xl sm:text-2xl font-black text-zinc-300">
              {formatCurrency(regularTotal)}
            </div>
            <span className="text-[10px] text-zinc-500">{formatCurrency(basePrice)} por placa individual</span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 space-y-1">
            <span className="text-[11px] font-semibold text-zinc-400">Estimado no Pacote B2B</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {formatCurrency(packageTotal)}
            </div>
            <span className="text-[10px] text-emerald-500 font-medium">
              Apenas {formatCurrency(simulatedUnitDiscounted)}/un negociado
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#c9a44c]/15 to-transparent border border-[#c9a44c]/30 space-y-1">
            <span className="text-[11px] font-bold text-[#e3c56c]">Economia no Bolso</span>
            <div className="text-xl sm:text-2xl font-black text-[#e3c56c]">
              {formatCurrency(savingsTotal)}
            </div>
            <span className="text-[10px] text-zinc-400">Dinheiro que fica na sua operação</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. EXTRATO DE CRÉDITOS - MOBILE FIRST COM CARDS & TABLE      */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950 p-5 sm:p-8 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#c9a44c]/15 border border-[#c9a44c]/30 flex items-center justify-center text-[#c9a44c]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Extrato de Movimentações</h2>
              <p className="text-xs text-zinc-400">Histórico de lotes concedidos, utilizações e estornos.</p>
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
                const isPositive = ['grant', 'granted', 'release', 'released', 'adjustment_add'].includes(type);
                const isNegative = ['consume', 'consumed', 'reserve', 'reserved', 'adjustment_remove', 'revoke'].includes(type);
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
                    const isPositive = ['grant', 'granted', 'release', 'released', 'adjustment_add'].includes(type);
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
          <h4 className="text-base font-bold text-white">Precisa de um volume diferente ou faturamento PJ?</h4>
          <p className="text-xs text-zinc-400">
            Nossa equipe comercial atende despachantes, oficinas, corretores e revendas com propostas sob medida.
          </p>
        </div>

        <a
          href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
            `Olá! Gostaria de conversar com a equipe sobre pacotes corporativos de consultas veiculares. Meu e-mail é ${userEmail}.`
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
            <span>Falar com Consultor</span>
          </Button>
        </a>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { confirmPayment } from '@/lib/customer/payment-service';
import { type PaymentMethod, CONSULTATION_PRICE_BRL } from '@/lib/customer/types';
import {
  QrCode,
  CreditCard,
  Barcode,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Lock,
  FileCheck2,
  Scale,
  Gavel,
  BadgePercent,
  Check,
  Zap,
  Info,
  Layers,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PaymentSimulationProps {
  consultation: {
    id: string;
    plate: string;
    status: string;
    payment_status: string;
  };
}

export function PaymentSimulation({ consultation }: PaymentSimulationProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formattedPlate = formatBrazilianPlate(consultation.plate);

  const originalPrice = 59.9;
  const currentPrice = CONSULTATION_PRICE_BRL; // 39.90
  const discountAmount = originalPrice - currentPrice;

  const paymentOptions: Array<{
    id: PaymentMethod;
    name: string;
    highlight: string;
    desc: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'pix',
      name: 'PIX Instantâneo',
      highlight: 'Liberação em segundos',
      desc: 'QR Code e chave Copia e Cola gerados na hora.',
      badge: 'Mais Rápido',
      icon: QrCode,
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      highlight: 'Até 3x de R$ 13,30',
      desc: 'Simulação com aprovação imediata.',
      badge: 'Sem Juros',
      icon: CreditCard,
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      highlight: 'Liquidação instantânea',
      desc: 'Compensação direta no ambiente de simulação.',
      badge: 'Simulado',
      icon: Barcode,
    },
  ];

  const reportDeliverables = [
    {
      icon: ShieldCheck,
      title: 'Roubo, Furto e Alerta Policial',
      desc: 'Varredura na base nacional SINESP e polícias estaduais.',
    },
    {
      icon: FileCheck2,
      title: 'Débitos, IPVA e Licenciamento',
      desc: 'Detalhamento de tributos vencidos e a vencer.',
    },
    {
      icon: Scale,
      title: 'Restrições Judiciais e Gravame',
      desc: 'Alienação fiduciária, arrendamento e bloqueios RENAJUD.',
    },
    {
      icon: Gavel,
      title: 'Histórico de Leilão e Sinistro',
      desc: 'Registros de leiloeiros oficiais e classificação de danos.',
    },
    {
      icon: BadgePercent,
      title: 'Cotação Oficial Tabela FIPE',
      desc: 'Histórico de valor de mercado e índice de depreciação.',
    },
    {
      icon: FileText,
      title: 'Laudo Completo e Download em PDF',
      desc: 'Documento oficial para impressão e comprovação.',
    },
  ];

  const handleConfirm = () => {
    setErrorMessage(null);

    startTransition(async () => {
      const res = await confirmPayment(consultation.id, selectedMethod);

      if (res.error) {
        setErrorMessage(res.error);
        toast.error(res.error);
      } else {
        toast.success('Pagamento confirmado com sucesso! Carregando laudo oficial...');
        router.push(`/cliente/consultas/${consultation.id}`);
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation Bar & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <Link
          href="/cliente"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-1 group-hover:text-[#c9a44c] transition-transform" />
          <span>Voltar ao painel</span>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
              1
            </span>
            <span className="hidden sm:inline">Identificação</span>
          </div>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-1.5 text-[#c9a44c]">
            <span className="w-5 h-5 rounded-full bg-[#c9a44c] text-zinc-950 flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <span className="font-bold">Pagamento & Liberação</span>
          </div>
          <span className="text-zinc-700">/</span>
          <div className="flex items-center gap-1.5 text-zinc-500">
            <span className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-500">
              3
            </span>
            <span className="hidden sm:inline">Laudo Emitido</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Vehicle & Report Deliverables (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Authentic Plate & Vehicle Header Card */}
          <div className="rounded-3xl bg-gradient-to-br from-zinc-900/90 via-[#0a0d14] to-zinc-950 border border-zinc-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#c9a44c]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-70" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CONSULTA VEICULAR EM TEMPO REAL</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading">
                  Finalizar Consulta
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Confirme a forma de liberação para acessar o laudo completo e o PDF autenticado.
                </p>
              </div>

              {/* Authentic Mercosul License Plate Graphic */}
              <div className="shrink-0 flex justify-center">
                <div className="w-52 rounded-xl overflow-hidden shadow-2xl border-2 border-zinc-600 bg-white select-none transition-transform hover:scale-105 duration-200">
                  {/* Blue Mercosul Header */}
                  <div className="bg-[#003399] px-3 py-1 flex items-center justify-between text-white">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full border border-white/60 flex items-center justify-center">
                        <span className="text-[7px] font-bold">★</span>
                      </div>
                      <span className="text-[9px] font-black tracking-wider uppercase">MERCOSUL</span>
                    </div>
                    <span className="text-[11px] font-black tracking-widest">BRASIL</span>
                    <div className="w-4 h-2.5 bg-[#009b3a] rounded-xs relative flex items-center justify-center overflow-hidden">
                      <div className="w-2.5 h-2 bg-[#fedf00] rotate-45" />
                      <div className="absolute w-1.5 h-1.5 bg-[#002776] rounded-full" />
                    </div>
                  </div>

                  {/* Plate Letters Area */}
                  <div className="bg-white py-2 px-3 flex items-center justify-center relative">
                    <span className="font-mono font-black text-2xl text-zinc-950 tracking-[0.25em] drop-shadow-xs">
                      {formattedPlate}
                    </span>
                    <div className="absolute bottom-1 right-2 text-[8px] font-bold text-zinc-400 font-mono">
                      BR
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Value Inclusions Card */}
          <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c9a44c]" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  O que está incluso neste laudo oficial
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                9 Módulos Oficiais
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportDeliverables.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-zinc-900/40 border border-zinc-800/70 hover:border-zinc-700/80 transition-colors flex items-start gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 flex items-center justify-center text-[#c9a44c] shrink-0 group-hover:bg-[#c9a44c] group-hover:text-zinc-950 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-white tracking-tight">{item.title}</h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Satisfaction / Guarantee Footnote */}
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#c9a44c] shrink-0" />
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Garantia AF Motos:</strong> Acesso vitalício ao relatório na sua Área do Cliente com opção de exportação em PDF autenticado a qualquer momento.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout & Payment Confirmation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-gradient-to-b from-zinc-950/95 via-[#0a0d14] to-zinc-950 border border-zinc-800/90 p-6 sm:p-7 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-6">
            {/* Top Accent Gold Strip */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-90" />

            {/* Price & Summary Header */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Resumo do Pedido
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c9a44c] bg-[#c9a44c]/10 border border-[#c9a44c]/20 px-2.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  Checkout Seguro
                </span>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400 block line-through">
                    De R$ {originalPrice.toFixed(2).replace('.', ',')}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-white font-mono">
                      R$ {currentPrice.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      (Economize R$ {discountAmount.toFixed(2).replace('.', ',')})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-zinc-300 block">Pagamento Único</span>
                  <span className="text-[10px] text-zinc-500">Sem mensalidade</span>
                </div>
              </div>
            </div>

            {/* Test Simulation Mode Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Modo de Homologação Imediata</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Ambiente de teste ativo: ao clicar em confirmar, a liberação e consulta veicular ocorrem instantaneamente <strong>sem cobrança bancária real</strong>.
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Escolha a forma de liberação:
              </label>

              <div className="space-y-2.5">
                {paymentOptions.map((opt) => {
                  const isSelected = selectedMethod === opt.id;
                  const Icon = opt.icon;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => !isPending && setSelectedMethod(opt.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#c9a44c]/15 to-[#c9a44c]/5 border-[#c9a44c] shadow-lg shadow-[#c9a44c]/10'
                          : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/70'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-gradient-to-br from-[#c9a44c] to-[#a38030] text-zinc-950 font-black shadow-md'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{opt.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isSelected
                                  ? 'bg-[#c9a44c]/20 text-[#c9a44c] border border-[#c9a44c]/40'
                                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                              }`}
                            >
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                            {opt.highlight}
                          </p>
                        </div>
                      </div>

                      {/* Custom Radio check */}
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'border-[#c9a44c] bg-[#c9a44c] text-zinc-950 shadow-xs'
                            : 'border-zinc-700 bg-transparent'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <Button
                onClick={handleConfirm}
                disabled={isPending}
                className="w-full h-14 bg-gradient-to-r from-[#d4b35e] via-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-black text-sm rounded-2xl shadow-xl shadow-[#c9a44c]/25 transition-all duration-300 relative overflow-hidden group active:scale-[0.98]"
              >
                {/* Shimmer light effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform pointer-events-none" />

                {isPending ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Liberando pagamento e gerando laudo...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Confirmar e Liberar Laudo</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </div>

            {/* Security Guarantee Badges */}
            <div className="pt-2 border-t border-zinc-800/70 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Criptografia SSL 256-bit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#c9a44c]" />
                <span>Base Oficial API Brasil</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { confirmPayment } from '@/lib/customer/payment-service';
import { type PaymentMethod, CONSULTATION_PRICE_BRL } from '@/lib/customer/types';
import {
  QrCode,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Lock,
  Zap,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ConsultationProcessingModal } from './consultation-processing-modal';

interface PaymentSimulationProps {
  consultation: {
    id: string;
    plate: string;
    status: string;
    payment_status: string;
  };
  price?: number;
}

export function PaymentSimulation({ consultation, price }: PaymentSimulationProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [showAllPerks, setShowAllPerks] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // High-End Animated Processing Modal states
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [isApiDone, setIsApiDone] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // If already completed prior to opening page (e.g. reload or direct link), redirect
  useEffect(() => {
    if (consultation.status === 'completed' && !isProcessingModalOpen) {
      router.replace(`/cliente/consultas/${consultation.id}`);
    }
  }, [consultation.status, consultation.id, isProcessingModalOpen, router]);

  const formattedPlate = formatBrazilianPlate(consultation.plate);

  const currentPrice = typeof price === 'number' && price > 0 ? price : CONSULTATION_PRICE_BRL;
  const competitorPrice = 64.90;
  const originalAnchorPrice = Math.max(currentPrice + 10, competitorPrice);
  const discountPercent = Math.max(5, Math.round(((originalAnchorPrice - currentPrice) / originalAnchorPrice) * 100));

  const installmentValue = (currentPrice / 3).toFixed(2).replace('.', ',');
  const formattedCurrentPrice = currentPrice.toFixed(2).replace('.', ',');
  const formattedAnchorPrice = originalAnchorPrice.toFixed(2).replace('.', ',');

  const paymentOptions: Array<{
    id: PaymentMethod;
    name: string;
    tag?: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'pix',
      name: 'PIX Instantâneo',
      tag: 'Recomendado',
      desc: 'Liberação imediata em segundos via QR Code ou Copia e Cola',
      icon: QrCode,
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      tag: `Até 3x de R$ ${installmentValue}`,
      desc: 'Aprovação simulada na hora sem juros',
      icon: CreditCard,
    },
  ];

  const reportPerks = [
    'Roubo & Furto Ativo',
    'Débitos de IPVA & Taxas',
    'Multas DETRAN / PRF / DER',
    'Restrições Judiciais (RENAJUD)',
    'Alienação & Gravames',
    'Histórico de Leilão & Sinistro',
    'Histórico de Proprietários',
    'Cotação Oficial Tabela FIPE',
    'Histórico de Km & Anúncios',
    'Ficha Técnica (SENATRAN/BIN)',
    'Bloqueio de Guincho/Admin',
    'Laudo Oficial em PDF',
  ];

  const displayedPerks = showAllPerks ? reportPerks : reportPerks.slice(0, 6);

  const handleConfirm = () => {
    setErrorMessage(null);
    setApiError(null);
    setIsApiDone(false);
    setIsProcessingModalOpen(true);

    startTransition(async () => {
      try {
        const res = await confirmPayment(consultation.id, selectedMethod);

        if (res.error) {
          setApiError(res.error);
          setErrorMessage(res.error);
          toast.error(res.error);
        } else {
          setIsApiDone(true);
        }
      } catch (err) {
        console.error('[handleConfirm] payment error:', err);
        const fallbackMsg = 'Erro inesperado ao confirmar pagamento. Tente novamente.';
        setApiError(fallbackMsg);
        setErrorMessage(fallbackMsg);
        toast.error(fallbackMsg);
      }
    });
  };

  const handleProcessingFinished = () => {
    toast.success('Laudo veicular gerado com sucesso!');
    router.push(`/cliente/consultas/${consultation.id}`);
    router.refresh();
  };

  const handleProcessingRetry = () => {
    setIsProcessingModalOpen(false);
    setApiError(null);
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 px-1 sm:px-0">
      {/* Top Breadcrumb & Step Indicator */}
      <div className="flex items-center justify-between">
        <Link
          href="/cliente"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors group py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 group-hover:-translate-x-1 group-hover:text-[#c9a44c] transition-transform" />
          <span>Voltar ao painel</span>
        </Link>

        {/* Step Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Etapa 2 de 2 • Pagamento</span>
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0e121a] via-[#090c13] to-[#07090f] border border-zinc-800/90 p-4 sm:p-7 backdrop-blur-2xl shadow-2xl relative overflow-hidden space-y-5 sm:space-y-6">
        {/* Subtle Ambient Gold Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        {/* Header: Title, Plate & Amount */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-[#c9a44c] font-bold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>PAGAMENTO SEGURO</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight font-heading mt-0.5">
                Finalizar Consulta
              </h1>
            </div>

            {/* Compact Mercosul Plate Badge */}
            <div className="w-28 sm:w-36 rounded-md sm:rounded-lg overflow-hidden border border-zinc-500 shadow-md bg-white select-none shrink-0">
              <div className="bg-[#003399] px-1.5 sm:px-2 py-0.5 flex items-center justify-between text-white text-[7px] sm:text-[8px] font-black tracking-wider">
                <span>MERCOSUL</span>
                <span>BRASIL</span>
              </div>
              <div className="bg-white py-0.5 sm:py-1 px-1.5 text-center">
                <span className="font-mono font-black text-xs sm:text-sm text-zinc-950 tracking-wider sm:tracking-widest">
                  {formattedPlate}
                </span>
              </div>
            </div>
          </div>

          {/* Value and Product Summary Box */}
          <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[11px] sm:text-xs text-zinc-400 block font-medium">Produto:</span>
                <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 mt-0.5 truncate">
                  <FileText className="w-3.5 h-3.5 text-[#c9a44c] shrink-0" />
                  Laudo Veicular Completo AF Motos
                </span>
              </div>

              <div className="text-right flex flex-col items-end justify-center shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] sm:text-xs text-red-500 font-semibold line-through decoration-red-500/80">
                    R$ {formattedAnchorPrice}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                    -{discountPercent}% OFF
                  </span>
                </div>
                <span className="text-xl sm:text-3xl font-black text-emerald-400 font-mono leading-none mt-1">
                  R$ {formattedCurrentPrice}
                </span>
              </div>
            </div>

            {/* Verifications included in the full report - 2 Columns on Mobile & Desktop */}
            <div className="pt-2.5 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Verificações no Laudo ({reportPerks.length} Itens):
                </span>
                <button
                  type="button"
                  onClick={() => setShowAllPerks(!showAllPerks)}
                  className="text-[10px] sm:text-[11px] text-[#c9a44c] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{showAllPerks ? 'Ver menos' : `Ver todos (+${reportPerks.length - 6})`}</span>
                  {showAllPerks ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
                {displayedPerks.map((perk, idx) => (
                  <div
                    key={idx}
                    className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium px-2 py-1 rounded-md sm:rounded-lg bg-zinc-950/80 border border-zinc-800/80 text-zinc-300 transition-colors"
                  >
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#c9a44c] shrink-0" />
                    <span className="truncate">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Forma de Pagamento:
          </label>

          <div className="space-y-2.5">
            {paymentOptions.map((opt) => {
              const isSelected = selectedMethod === opt.id;
              const Icon = opt.icon;

              return (
                <div
                  key={opt.id}
                  onClick={() => !isPending && setSelectedMethod(opt.id)}
                  className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-2.5 sm:gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#c9a44c]/15 via-[#c9a44c]/10 to-transparent border-[#c9a44c] shadow-md shadow-[#c9a44c]/10'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#c9a44c] text-zinc-950 font-black shadow-sm'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">{opt.name}</span>
                        {opt.tag && (
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                              isSelected
                                ? 'bg-[#c9a44c]/20 text-[#c9a44c] border border-[#c9a44c]/40'
                                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                            }`}
                          >
                            {opt.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 truncate">{opt.desc}</p>
                    </div>
                  </div>

                  {/* Radio Indicator */}
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'border-[#c9a44c] bg-[#c9a44c] text-zinc-950'
                        : 'border-zinc-700 bg-transparent'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Discreet Simulation Notice */}
        <div className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs text-amber-300/90">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Ambiente de Simulação:</strong> Liberação imediata sem cobrança real.
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 sm:p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Primary CTA */}
        <Button
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full h-12 sm:h-13 bg-gradient-to-r from-[#d4b35e] via-[#c9a44c] to-[#b38e3a] hover:brightness-110 text-zinc-950 font-black text-xs sm:text-sm rounded-xl shadow-xl shadow-[#c9a44c]/20 transition-all duration-200 group active:scale-[0.98] cursor-pointer"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Confirmando e buscando laudo...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Confirmar Pagamento e Ver Laudo</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>

        {/* Trust Badges Footer */}
        <div className="pt-2 border-t border-zinc-800/70 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Criptografia SSL 256-bit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a44c]" />
            <span>Emissão Imediata</span>
          </div>
        </div>
      </div>

      {/* Senior Fullscreen Processing Animation Modal */}
      <ConsultationProcessingModal
        isOpen={isProcessingModalOpen}
        plate={consultation.plate}
        isApiDone={isApiDone}
        apiError={apiError}
        onFinished={handleProcessingFinished}
        onRetry={handleProcessingRetry}
      />
    </div>
  );
}

'use client';

import React, { useState, useTransition } from 'react';
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

  const paymentOptions: Array<{
    id: PaymentMethod;
    name: string;
    desc: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'pix',
      name: 'PIX Imediato',
      desc: 'Liberação instantânea em segundos',
      badge: 'Recomendado',
      icon: QrCode,
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      desc: 'Simulação com aprovação instantânea',
      badge: 'Imediato',
      icon: CreditCard,
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      desc: 'Simulação de liquidação imediata',
      badge: 'Simulado',
      icon: Barcode,
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
        toast.success('Pagamento confirmado com sucesso! Carregando laudo...');
        router.push(`/cliente/consultas/${consultation.id}`);
        router.refresh();
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Header Summary */}
      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        <div className="flex items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#c9a44c] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente Seguro</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Finalizar Consulta Veicular
            </h2>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80">
            <span className="font-mono font-bold text-base text-white tracking-widest">
              {formattedPlate}
            </span>
          </div>
        </div>

        {/* Price row */}
        <div className="py-4 flex items-center justify-between">
          <span className="text-sm text-zinc-400 font-medium">Total a pagar:</span>
          <span className="text-2xl font-black text-white">
            R$ {CONSULTATION_PRICE_BRL.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Notice of simulation */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
          <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong>Ambiente de Simulação:</strong> Este pagamento é uma simulação para liberação imediata do laudo veicular sem cobrança no seu cartão ou conta real.
          </span>
        </div>
      </div>

      {/* Payment Methods Selection */}
      <div className="rounded-3xl bg-zinc-950/70 border border-zinc-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-2xl space-y-4">
        <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">
          Selecione a forma de pagamento:
        </h3>

        <div className="space-y-3">
          {paymentOptions.map((opt) => {
            const isSelected = selectedMethod === opt.id;
            const Icon = opt.icon;

            return (
              <div
                key={opt.id}
                onClick={() => !isPending && setSelectedMethod(opt.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-[#c9a44c]/10 border-[#c9a44c] shadow-md shadow-[#c9a44c]/10'
                    : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[#c9a44c] text-zinc-950 font-bold'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{opt.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-[#c9a44c] border border-zinc-700">
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{opt.desc}</p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-[#c9a44c] bg-[#c9a44c] text-zinc-950'
                      : 'border-zinc-700 bg-transparent'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-4 h-4 fill-zinc-950 stroke-[#c9a44c]" />}
                </div>
              </div>
            );
          })}
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full h-12 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:from-[#d8b35b] hover:to-[#c49e49] text-zinc-950 font-bold text-sm rounded-xl shadow-lg shadow-[#c9a44c]/20 transition-all duration-200 mt-4"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processando pagamento e consultando base...</span>
            </span>
          ) : (
            <span>Confirmar Pagamento e Ver Laudo</span>
          )}
        </Button>
      </div>
    </div>
  );
}

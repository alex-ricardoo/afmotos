'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  FileText,
  AlertCircle,
  Loader2,
  Car,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { MercosulPlateInput } from '@/components/vehicle-history/mercosul-plate-input';
import { isValidBrazilianPlate, formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import { initiateConsultation } from '@/lib/customer/consultation-service';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function NewConsultationForm() {
  const router = useRouter();
  const [plate, setPlate] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isPlateValid = isValidBrazilianPlate(plate);
  const formattedPlate = isPlateValid ? formatBrazilianPlate(plate) : plate;

  const handlePlateChange = (newPlate: string) => {
    setPlate(newPlate);
    setIsConfirmed(false);
    if (errorMsg) {
      setErrorMsg(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!plate || plate.trim().length === 0) {
      setErrorMsg('Digite a placa do veículo para consultar.');
      return;
    }

    if (!isValidBrazilianPlate(plate)) {
      setErrorMsg('Informe uma placa válida no padrão Mercosul (ABC1D23) ou antigo (ABC-1234).');
      return;
    }

    if (!isConfirmed) {
      setErrorMsg('Confirme que a placa informada está correta antes de prosseguir.');
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await initiateConsultation(plate);

        if (res.error) {
          setErrorMsg(res.error);
          toast.error(res.error);
          return;
        }

        if (res.consultationId) {
          toast.success(`Placa ${formatBrazilianPlate(plate)} confirmada!`);
          router.push(`/cliente/pagamento/${res.consultationId}`);
        } else {
          router.push('/cliente');
        }
      } catch (err) {
        console.error('Error initiating consultation:', err);
        setErrorMsg('Erro inesperado ao iniciar consulta. Tente novamente.');
        toast.error('Erro ao iniciar consulta.');
      }
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300 px-1 sm:px-0">
      {/* Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link
          href="/cliente"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-1 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 group-hover:-translate-x-1 group-hover:text-[#c9a44c] transition-transform" />
          <span>Voltar ao painel</span>
        </Link>

        {/* Step Indicator Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#c9a44c] animate-pulse" />
          <span>Etapa 1 de 2 • Placa</span>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#0e121a] via-[#090c13] to-[#07090f] border border-zinc-800/90 p-4 sm:p-7 backdrop-blur-2xl shadow-2xl overflow-hidden space-y-5 sm:space-y-6">
        {/* Subtle Top Gold Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        {/* Header Content */}
        <div className="text-center space-y-1.5">
          <div className="w-11 h-11 rounded-2xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] flex items-center justify-center mx-auto shadow-sm">
            <Car className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
            Nova Consulta Veicular
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Digite a placa de qualquer carro ou moto para verificar o histórico e emitir o laudo de procedência.
          </p>
        </div>

        {/* Plate Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Visual Mercosul Plate Input */}
          <div className="space-y-2 text-center">
            <label
              htmlFor="mercosul-plate-field"
              className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block"
            >
              Digite a Placa do Veículo
            </label>
            <MercosulPlateInput
              value={plate}
              onChange={handlePlateChange}
              error={errorMsg}
              autoFocus
            />
          </div>

          {/* Error Message Box */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Confirmation Checkbox Box (Visible and highlighted when plate is valid) */}
          {isPlateValid ? (
            <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#c9a44c]/[0.07] border border-[#c9a44c]/30 space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between gap-2 border-b border-[#c9a44c]/20 pb-2">
                <span className="text-xs text-zinc-300 font-medium">
                  Placa identificada:
                </span>
                <span className="font-mono font-black text-[#c9a44c] bg-zinc-950/80 px-2.5 py-0.5 rounded-md border border-[#c9a44c]/30 text-sm tracking-wider">
                  {formattedPlate}
                </span>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => {
                    setIsConfirmed(e.target.checked);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-[#c9a44c] focus:ring-[#c9a44c] accent-[#c9a44c] cursor-pointer shrink-0"
                />
                <span className="text-xs text-zinc-300 leading-snug group-hover:text-zinc-100 transition-colors">
                  Conferi e confirmo que a placa <strong className="text-white font-mono">{formattedPlate}</strong> está correta para este veículo.
                </span>
              </label>
            </div>
          ) : (
            <div className="text-center py-1">
              <span className="text-[11px] text-zinc-500">
                Padrão Mercosul (ABC1D23) ou Tradicional (ABC-1234)
              </span>
            </div>
          )}

          {/* Action Button */}
          <Button
            type="submit"
            disabled={isPending || !isPlateValid || !isConfirmed}
            className={`w-full h-12 text-sm sm:text-base font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
              isPlateValid && isConfirmed
                ? 'bg-gradient-to-r from-[#c9a44c] via-[#d4b35e] to-[#b38e3a] hover:brightness-110 text-zinc-950 shadow-[#c9a44c]/20 active:scale-[0.99]'
                : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed opacity-60'
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                <span>Confirmando Placa...</span>
              </>
            ) : (
              <>
                <span>Continuar para Pagamento</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          {/* Secure Step Notice */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              Ambiente Seguro
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#c9a44c]" />
              Dados Oficiais
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}

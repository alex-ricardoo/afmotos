'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, Zap, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface PayWithCreditButtonProps {
  consultationId: string;
  balance: number;
  plate?: string;
}

export function PayWithCreditButton({ consultationId, balance, plate }: PayWithCreditButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (balance <= 0) return null;

  const handleConfirmPay = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cliente/consultas/${consultationId}/pay-with-credit`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Seu crédito foi reservado. Estamos preparando o laudo.');
        setIsOpen(false);
        router.push(`/cliente/consultas/${consultationId}`);
      } else {
        toast.error(
          data.error ||
            'Não foi possível concluir a consulta neste momento. Seu crédito não foi consumido e continua disponível.',
        );
        setLoading(false);
      }
    } catch (err) {
      console.error('[PAY_WITH_CREDIT]', err);
      toast.error('Erro de conexão ao processar o crédito. Tente novamente.');
      setLoading(false);
    }
  };

  const remainingAfter = Math.max(0, balance - 1);

  return (
    <>
      {/* Banner de Crédito Disponível */}
      <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-linear-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 shadow-lg shadow-amber-500/5 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                  Saldo de Pacote
                </span>
                {plate && (
                  <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/60 uppercase">
                    {plate}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 mt-1">
                Você possui{' '}
                <span className="text-amber-400">
                  {balance} {balance === 1 ? 'crédito' : 'créditos'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Utilize 1 crédito para liberar este laudo veicular com segurança.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold px-5 py-2.5 rounded-xl shadow-md shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Zap className="h-4 w-4 fill-current" />
            <span>Usar 1 Crédito</span>
          </Button>
        </div>
      </div>

      {/* Modal Organizado de Confirmação */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-zinc-100">
              Confirmar Uso de Crédito
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1 text-center">
              Deseja usar 1 crédito do seu pacote para liberar esta consulta veicular agora?
            </DialogDescription>
          </DialogHeader>

          {/* Resumo da Operação */}
          <div className="my-2 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/90 space-y-3">
            {plate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Veículo / Placa:</span>
                <span className="font-mono font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                  {plate.toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Saldo disponível atual:</span>
              <span className="font-semibold text-zinc-200">
                {balance} {balance === 1 ? 'crédito' : 'créditos'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Custo desta liberação:</span>
              <span className="font-bold text-amber-400">-1 crédito</span>
            </div>

            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">Saldo após liberação:</span>
              <span className="font-bold text-emerald-400">
                {remainingAfter} {remainingAfter === 1 ? 'crédito' : 'créditos'}
              </span>
            </div>
          </div>

          {/* Garantia / Benefício */}
          <div className="flex items-center gap-2.5 text-[11px] text-zinc-300 bg-amber-950/20 border border-amber-500/20 px-3 py-2.5 rounded-xl">
            <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              1 crédito será reservado para esta consulta. Ele só será consumido após a entrega do
              laudo. Se não for possível concluir a consulta, o crédito será devolvido.
            </span>
          </div>

          {/* Rodapé de Ações */}
          <DialogFooter className="mt-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="w-full sm:w-auto border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPay}
              disabled={loading}
              className="w-full sm:w-auto bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Liberando laudo...</span>
                </>
              ) : (
                <>
                  <span>Confirmar e Liberar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

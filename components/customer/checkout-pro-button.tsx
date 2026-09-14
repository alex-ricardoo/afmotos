'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { MercadoPagoBrandIcon } from './payment-brand-icons';

interface CheckoutProButtonProps {
  consultationId: string;
  amountText?: string;
  className?: string;
}

export function CheckoutProButton({
  consultationId,
  amountText,
  className,
}: CheckoutProButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleStartCheckout = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/mp/checkout-pro/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ consultationId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Não foi possível iniciar o pagamento. Tente novamente.';
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      if (data.redirectUrl) {
        toast.info('Redirecionando para o ambiente seguro do Mercado Pago...');
        window.location.assign(data.redirectUrl);
      } else {
        toast.error('URL de redirecionamento não retornada pelo servidor.');
        setLoading(false);
      }
    } catch (err) {
      console.error('[CheckoutProButton] Erro ao iniciar checkout:', err);
      toast.error('Ocorreu uma falha de conexão. Verifique sua internet e tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        onClick={handleStartCheckout}
        disabled={loading}
        className={`relative overflow-hidden w-full py-3 sm:py-3.5 px-4 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-[#009ee3] via-[#008fe3] to-[#0070ba] hover:from-[#0ab1fc] hover:via-[#009ee3] hover:to-[#007eb5] border-t border-white/30 shadow-[0_6px_20px_-4px_rgba(0,158,227,0.45)] hover:shadow-[0_10px_28px_-3px_rgba(0,158,227,0.6)] transition-all duration-300 rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 sm:gap-2.5 group active:scale-[0.99] cursor-pointer ${className || ''}`}
      >
        {/* Efeito sutil de brilho/sheen animado no hover */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-out pointer-events-none" />

        {loading ? (
          <>
            <Loader2 className="h-4 w-4 sm:h-4.5 sm:w-4.5 animate-spin shrink-0 text-white" />
            <span className="text-xs sm:text-sm">Iniciando Checkout Seguro...</span>
          </>
        ) : (
          <>
            <div className="flex h-5 w-5 sm:h-5.5 sm:w-5.5 items-center justify-center rounded-full bg-white text-[#009ee3] shadow-sm shrink-0 transition-transform group-hover:scale-105">
              <MercadoPagoBrandIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#009ee3]" />
            </div>
            <span className="tracking-tight">
              {amountText ? `Pagar ${amountText} com Mercado Pago` : 'Pagar com Mercado Pago'}
            </span>
          </>
        )}
      </Button>

      {/* Selos de Confiança e Garantia */}
      <div className="grid grid-cols-3 gap-1 sm:gap-2 pt-2 border-t border-zinc-800/80">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1 text-center sm:text-left text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400 shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-medium leading-tight">
            Criptografia SSL
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1 text-center sm:text-left text-zinc-400">
          <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-sky-400 shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-medium leading-tight">
            Liberação Imediata
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-1 text-center sm:text-left text-zinc-400">
          <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-medium leading-tight">
            Garantia Oficial
          </span>
        </div>
      </div>
    </div>
  );
}

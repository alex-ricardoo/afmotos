'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, ExternalLink } from 'lucide-react';

interface CheckoutProButtonProps {
  consultationId: string;
  className?: string;
}

export function CheckoutProButton({ consultationId, className }: CheckoutProButtonProps) {
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
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handleStartCheckout}
        disabled={loading}
        className={`w-full py-6 text-base font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all rounded-xl flex items-center justify-center gap-2 group ${className || ''}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Iniciando Checkout Seguro...</span>
          </>
        ) : (
          <>
            <span>Pagar com Mercado Pago</span>
            <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        <span>Ambiente seguro do Mercado Pago (Pix, Cartão, Débito e Boleto)</span>
      </div>
    </div>
  );
}

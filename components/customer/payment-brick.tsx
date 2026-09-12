'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { processBrickPaymentAction } from '@/lib/mercadopago/actions';
import {
  type PaymentPreferenceData,
  type ProcessBrickPaymentResult,
  type BrickSubmitFormData,
} from '@/lib/mercadopago/types';
import { PaymentSecurityNotice } from './payment-security-notice';

interface MercadoPagoBrickController {
  unmount?: () => void;
}

interface MercadoPagoBricksBuilder {
  create: (
    brickName: string,
    containerId: string,
    options: Record<string, unknown>,
  ) => Promise<MercadoPagoBrickController>;
}

interface MercadoPagoInstance {
  bricks: () => MercadoPagoBricksBuilder;
}

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

interface PaymentBrickProps {
  preference: PaymentPreferenceData;
  onPaymentSuccess?: (result: ProcessBrickPaymentResult) => void;
  onAsyncPaymentCreated?: (result: ProcessBrickPaymentResult) => void;
  onLookupFailedRefunded?: (errorMsg?: string) => void;
  className?: string;
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function PaymentBrick({
  preference,
  onPaymentSuccess,
  onAsyncPaymentCreated,
  onLookupFailedRefunded,
  className = '',
}: PaymentBrickProps) {
  const router = useRouter();
  const [isSdkLoaded, setIsSdkLoaded] = useState(() => {
    return typeof window !== 'undefined' && Boolean(window.MercadoPago);
  });
  const [isBrickReady, setIsBrickReady] = useState(false);
  const [isProcessing, startTransition] = useTransition();
  const [brickError, setBrickError] = useState<string | null>(null);
  const brickControllerRef = useRef<MercadoPagoBrickController | null>(null);
  const containerId = 'mercadopago-payment-brick-container';

  const formattedTotal = currencyFormatter.format(preference.amount);

  // 1. Dynamically load Mercado Pago JS SDK v2
  useEffect(() => {
    if (typeof window !== 'undefined' && window.MercadoPago) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.onload = () => {
      setIsSdkLoaded(true);
    };
    script.onerror = () => {
      setBrickError('Falha ao carregar o módulo seguro de pagamentos do Mercado Pago.');
    };

    document.body.appendChild(script);

    return () => {
      if (!window.MercadoPago && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // 2. Initialize Payment Brick when SDK is ready
  useEffect(() => {
    if (!isSdkLoaded || !preference.publicKey || !window.MercadoPago) return;

    let isMounted = true;

    async function initBrick() {
      try {
        if (!window.MercadoPago) return;
        const mp = new window.MercadoPago(preference.publicKey, {
          locale: 'pt-BR',
        });

        const bricksBuilder = mp.bricks();

        // Clear existing container if re-rendering
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = '';
        }

        const controller = await bricksBuilder.create('payment', containerId, {
          initialization: {
            amount: preference.amount,
            payer: {
              email: preference.payerEmail,
            },
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              ticket: 'all',
              bankTransfer: 'all',
              mercadoPago: 'all',
              maxInstallments: 1,
            },
            visual: {
              style: {
                theme: 'dark',
                customVariables: {
                  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                  formBackgroundColor: 'transparent',
                  baseColor: '#c9a44c',
                  baseColorFirstVariant: '#b38e3a',
                  baseColorSecondVariant: '#8f6d25',
                  outlinePrimaryColor: '#c9a44c',
                  borderRadiusSmall: '8px',
                  borderRadiusMedium: '10px',
                  borderRadiusLarge: '12px',
                },
              },
              hidePaymentButton: false,
              hideFormTitle: true,
            },
          },
          callbacks: {
            onReady: () => {
              if (isMounted) setIsBrickReady(true);
            },
            onSubmit: ({ formData }: { formData: BrickSubmitFormData }) => {
              return new Promise<void>((resolve, reject) => {
                startTransition(async () => {
                  try {
                    const result = await processBrickPaymentAction(
                      preference.consultationId,
                      formData,
                    );

                    if (!result.success) {
                      if (result.status === 'lookup_failed_refunded') {
                        onLookupFailedRefunded?.(result.error);
                        resolve();
                        return;
                      }

                      toast.error(result.error || 'Pagamento não aprovado. Tente outro meio.');
                      reject();
                      return;
                    }

                    if (result.status === 'approved') {
                      toast.success('Pagamento aprovado! Preparando seu histórico veicular...');
                      onPaymentSuccess?.(result);
                      router.push(`/cliente/consultas/${preference.consultationId}`);
                    } else if (result.status === 'pending' || result.status === 'in_process') {
                      toast.info('Pagamento gerado! Aguardando confirmação.');
                      onAsyncPaymentCreated?.(result);
                    }

                    resolve();
                  } catch (err: unknown) {
                    const errorMsg =
                      err instanceof Error ? err.message : 'Erro ao processar pagamento.';
                    toast.error(errorMsg);
                    reject();
                  }
                });
              });
            },
            onError: (error: unknown) => {
              console.error('[MercadoPago Brick Error]:', error);
              setBrickError('Ocorreu uma instabilidade no formulário de pagamento.');
            },
          },
        });

        if (isMounted) {
          brickControllerRef.current = controller;
        }
      } catch (err: unknown) {
        console.error('[initBrick] Error instantiating Brick:', err);
        if (isMounted) {
          setBrickError('Não foi possível carregar as opções de pagamento no momento.');
        }
      }
    }

    initBrick();

    return () => {
      isMounted = false;
      if (brickControllerRef.current?.unmount) {
        brickControllerRef.current.unmount();
      }
    };
  }, [
    isSdkLoaded,
    preference.publicKey,
    preference.amount,
    preference.consultationId,
    preference.payerEmail,
    router,
    onPaymentSuccess,
    onAsyncPaymentCreated,
    onLookupFailedRefunded,
  ]);

  return (
    <div
      className={`relative w-full rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/40 ${className}`}
    >
      {/* Header: Clean title & Total value */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Pagamento Seguro
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              Oficial
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Selecione o meio de pagamento para liberar seu laudo.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] text-zinc-400 block">Total a pagar</span>
          <span className="text-lg sm:text-xl font-bold text-amber-400 tabular-nums">
            {formattedTotal}
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {(!isSdkLoaded || !isBrickReady) && !brickError && (
        <div
          className="space-y-3 py-6 animate-pulse"
          aria-live="polite"
          aria-label="Carregando opções de pagamento"
        >
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs py-2">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <span>Carregando ambiente seguro do Mercado Pago...</span>
          </div>
          <div className="h-12 w-full rounded-xl bg-zinc-800/50" />
          <div className="h-12 w-full rounded-xl bg-zinc-800/30" />
          <div className="h-12 w-full rounded-xl bg-zinc-800/30" />
        </div>
      )}

      {/* Error state */}
      {brickError && (
        <div className="my-5 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
          <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-red-200">{brickError}</p>
          <p className="text-xs text-zinc-400 mt-1">
            Verifique sua conexão ou tente recarregar as opções de pagamento.
          </p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Processing overlay blocking interaction during submit */}
      {isProcessing && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-zinc-950/85 backdrop-blur-sm p-6 text-center"
          aria-live="assertive"
        >
          <Loader2 className="h-7 w-7 animate-spin text-amber-400 mb-3" />
          <p className="text-sm sm:text-base font-bold text-white">
            Processando pagamento com o Mercado Pago...
          </p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Por favor, aguarde a confirmação sem fechar ou recarregar esta página.
          </p>
        </div>
      )}

      {/* Official Mercado Pago Payment Brick Container - No restrictive overflow or height */}
      <div
        id={containerId}
        className={!isBrickReady || brickError ? 'hidden' : 'w-full min-w-0 py-2'}
      />

      {/* Security Note Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        <PaymentSecurityNotice />
      </div>
    </div>
  );
}

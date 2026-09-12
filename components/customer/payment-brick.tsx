'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Lock } from 'lucide-react';
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

  // 2. Initialize Payment Brick when SDK is loaded
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
              prepaidCard: 'all',
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
                  baseColor: '#D97706',
                  baseColorFirstVariant: '#B45309',
                  baseColorSecondVariant: '#92400E',
                  outlinePrimaryColor: '#F59E0B',
                  fontSizeSmall: '12px',
                  fontSizeMedium: '13px',
                  fontSizeLarge: '15px',
                  formPadding: '0px',
                  borderRadiusSmall: '8px',
                  borderRadiusMedium: '10px',
                  borderRadiusLarge: '12px',
                  inputBackgroundColor: '#141417',
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
      className={`relative w-full rounded-2xl border border-zinc-800/90 bg-zinc-900/80 p-4 sm:p-6 shadow-xl backdrop-blur-md ${className}`}
    >
      {/* Card Header: Title & Total */}
      <div className="mb-5 border-b border-zinc-800/80 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Pagamento Seguro
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Escolha a forma de pagamento para liberar sua consulta.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-3.5 py-1.5 text-right shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
              Total
            </span>
            <span className="text-base sm:text-lg font-black text-amber-400">{formattedTotal}</span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton state to prevent layout shift */}
      {(!isSdkLoaded || !isBrickReady) && !brickError && (
        <div
          className="space-y-3.5 py-6 animate-pulse"
          aria-live="polite"
          aria-label="Carregando opções de pagamento"
        >
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-xs py-3">
            <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
            <span>Carregando ambiente seguro de pagamento...</span>
          </div>
          <div className="h-11 w-full rounded-xl bg-zinc-800/60" />
          <div className="h-12 w-full rounded-xl bg-zinc-800/40" />
          <div className="h-12 w-full rounded-xl bg-zinc-800/40" />
          <div className="h-11 w-full rounded-xl bg-amber-500/20" />
        </div>
      )}

      {/* Error state */}
      {brickError && (
        <div className="my-5 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
          <AlertTriangle className="h-6 w-6 text-red-400 mx-auto mb-2" aria-hidden="true" />
          <p className="text-sm font-medium text-red-200">{brickError}</p>
          <p className="text-xs text-zinc-400 mt-1">
            Verifique sua conexão ou tente recarregar as opções de pagamento.
          </p>
          <button
            onClick={() => window.location.reload()}
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* Processing overlay blocking duplicate interaction */}
      {isProcessing && (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-zinc-950/90 backdrop-blur-sm p-6 text-center"
          aria-live="assertive"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm sm:text-base font-bold text-white">
            Processando pagamento com o Mercado Pago...
          </p>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
            Por favor, não feche nem recarregue a página enquanto sua transação é confirmada.
          </p>
        </div>
      )}

      {/* Mercado Pago Payment Brick Container */}
      <div
        id={containerId}
        className={!isBrickReady || brickError ? 'hidden' : 'block min-h-[380px] w-full min-w-0'}
      />

      {/* Harmonized CSS for Mercado Pago Payment Brick */}
      <style>{`
        #${containerId} {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          font-family: inherit !important;
        }
        #${containerId} * {
          box-sizing: border-box !important;
        }
        /* Hide duplicate form title */
        #${containerId} h3,
        #${containerId} h2,
        #${containerId} [class*="form-title"],
        #${containerId} [class*="title-container"] {
          display: none !important;
        }
        /* Sleek input styling */
        #${containerId} input,
        #${containerId} select {
          font-size: 14px !important;
          border-radius: 10px !important;
          background-color: #141417 !important;
          border: 1px solid #27272a !important;
          color: #f4f4f5 !important;
        }
        #${containerId} input:focus,
        #${containerId} select:focus {
          border-color: #d97706 !important;
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2) !important;
          outline: none !important;
        }
        /* Confirm action button inside Brick */
        #${containerId} button[type="submit"],
        #${containerId} [class*="submit-button"],
        #${containerId} [class*="button--primary"] {
          min-height: 46px !important;
          font-size: 14px !important;
          font-weight: 700 !important;
          border-radius: 10px !important;
          background: #d97706 !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: 0 4px 14px rgba(217, 119, 6, 0.3) !important;
          cursor: pointer !important;
          transition: background-color 0.2s ease !important;
        }
        #${containerId} button[type="submit"]:hover,
        #${containerId} [class*="submit-button"]:hover {
          background: #b45309 !important;
        }
      `}</style>

      {/* Trust Notice footer */}
      <div className="mt-5 border-t border-zinc-800/80 pt-4">
        <PaymentSecurityNotice />
      </div>
    </div>
  );
}

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
              ticket: 'all',
              bankTransfer: 'all',
              creditCard: 'all',
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
                  fontSizeSmall: '11px',
                  fontSizeMedium: '13px',
                  fontSizeLarge: '15px',
                  formPadding: '0px',
                  borderRadiusSmall: '8px',
                  borderRadiusMedium: '10px',
                  borderRadiusLarge: '12px',
                  inputBackgroundColor: '#121215',
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
      className={`relative w-full overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950 p-4 sm:p-7 shadow-2xl shadow-black/80 backdrop-blur-md ${className}`}
    >
      {/* Subtle brand glow in background */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl"
        aria-hidden="true"
      />

      {/* Card Header */}
      <div className="mb-5 border-b border-zinc-800/80 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Pagamento Seguro
              </h2>
            </div>
            <p className="text-xs text-zinc-400">
              Escolha a forma de pagamento para liberar sua consulta.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 px-3.5 py-2 text-right shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
              Total
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-400">{formattedTotal}</span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton state to prevent layout shift */}
      {(!isSdkLoaded || !isBrickReady) && !brickError && (
        <div
          className="space-y-4 py-8 animate-pulse"
          aria-live="polite"
          aria-label="Carregando opções de pagamento"
        >
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm py-4">
            <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
            <span>Carregando ambiente seguro de pagamento...</span>
          </div>
          {/* Skeleton lines representing tabs and inputs */}
          <div className="h-12 w-full rounded-xl bg-zinc-800/60" />
          <div className="h-14 w-full rounded-xl bg-zinc-800/40" />
          <div className="h-14 w-full rounded-xl bg-zinc-800/40" />
          <div className="h-12 w-full rounded-xl bg-amber-500/20" />
        </div>
      )}

      {/* Error state */}
      {brickError && (
        <div className="my-6 rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center">
          <AlertTriangle className="h-7 w-7 text-red-400 mx-auto mb-2" aria-hidden="true" />
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
          className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-zinc-950/85 backdrop-blur-sm p-6 text-center"
          aria-live="assertive"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <p className="text-base font-bold text-white">
            Processando pagamento com o Mercado Pago...
          </p>
          <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
            Por favor, não feche nem recarregue a página enquanto sua transação é confirmada com
            segurança.
          </p>
        </div>
      )}

      {/* Mercado Pago Payment Brick Container */}
      <div
        id={containerId}
        className={!isBrickReady || brickError ? 'hidden' : 'block min-h-[420px]'}
      />

      {/* Targeted CSS overrides to make the Payment Brick match AF Motos luxury standard */}
      <style>{`
        #${containerId} {
          width: 100% !important;
          max-width: 100% !important;
          font-family: var(--font-sans, Inter), system-ui, -apple-system, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
        }
        #${containerId} * {
          box-sizing: border-box !important;
          font-family: inherit !important;
        }
        /* Hide Mercado Pago's duplicate generic header */
        #${containerId} h3,
        #${containerId} h2,
        #${containerId} [class*="form-title"],
        #${containerId} [class*="title-container"] {
          display: none !important;
        }
        /* Fix the radio button: prevent tall stretched capsules, force perfect 18px circle */
        #${containerId} input[type="radio"] {
          appearance: none !important;
          -webkit-appearance: none !important;
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          max-width: 18px !important;
          max-height: 18px !important;
          border-radius: 50% !important;
          border: 2px solid #52525b !important;
          background: transparent !important;
          margin: 0 10px 0 0 !important;
          cursor: pointer !important;
          align-self: center !important;
          flex-shrink: 0 !important;
          display: inline-block !important;
          vertical-align: middle !important;
        }
        #${containerId} input[type="radio"]:checked {
          border-color: #d97706 !important;
          background: radial-gradient(circle, #d97706 45%, transparent 50%) !important;
        }
        /* Reset any wrapper span around the radio button */
        #${containerId} [class*="radio"] {
          align-self: center !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          max-height: 22px !important;
          height: auto !important;
          min-height: unset !important;
          padding: 0 !important;
          flex-shrink: 0 !important;
        }
        /* Hide the awkward green "Parcelamento disponível" badge since vehicle consultation is single payment */
        #${containerId} [class*="installment"],
        #${containerId} [class*="badge"],
        #${containerId} [class*="tag"],
        #${containerId} [class*="discount"] {
          display: none !important;
        }
        /* Payment method list items: sleek dark card items with subtle gold hover */
        #${containerId} [class*="payment-method-item"],
        #${containerId} [class*="accordion-item"],
        #${containerId} [class*="payment-method-header"],
        #${containerId} li[class*="payment"] {
          border-radius: 12px !important;
          background: #141417 !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          margin-bottom: 8px !important;
          padding: 12px 14px !important;
          transition: all 0.2s ease !important;
          display: flex !important;
          align-items: center !important;
        }
        #${containerId} [class*="payment-method-item"]:hover,
        #${containerId} [class*="accordion-item"]:hover {
          border-color: rgba(217, 119, 6, 0.4) !important;
          background: #18181c !important;
        }
        #${containerId} [class*="selected"],
        #${containerId} [aria-expanded="true"] {
          border-color: #d97706 !important;
          background: #18181c !important;
          box-shadow: 0 0 0 1px rgba(217, 119, 6, 0.25) !important;
        }
        /* Payment method label typography */
        #${containerId} label,
        #${containerId} [class*="method-name"],
        #${containerId} [class*="label"] {
          color: #f4f4f5 !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          letter-spacing: -0.01em !important;
          cursor: pointer !important;
          margin: 0 !important;
        }
        /* Inputs inside card form: dark surfaces with gold focus outline */
        #${containerId} input,
        #${containerId} select {
          font-size: 14px !important;
          min-height: 46px !important;
          border-radius: 10px !important;
          background-color: #121215 !important;
          border: 1px solid #27272a !important;
          color: #f4f4f5 !important;
          padding: 10px 14px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        #${containerId} input:focus,
        #${containerId} select:focus {
          border-color: #d97706 !important;
          box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.25) !important;
          outline: none !important;
        }
        /* Primary confirm button inside Brick */
        #${containerId} button[type="submit"],
        #${containerId} [class*="submit-button"],
        #${containerId} [class*="button--primary"] {
          min-height: 48px !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          letter-spacing: 0.02em !important;
          border-radius: 12px !important;
          background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: 0 4px 16px rgba(217, 119, 6, 0.35) !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }
        #${containerId} button[type="submit"]:hover,
        #${containerId} [class*="submit-button"]:hover {
          background: linear-gradient(135deg, #b45309 0%, #92400e 100%) !important;
          box-shadow: 0 6px 20px rgba(217, 119, 6, 0.5) !important;
          transform: translateY(-1px) !important;
        }
      `}</style>

      {/* Trust Notice footer inside or immediately below the payment card */}
      <div className="mt-5 border-t border-zinc-800/80 pt-4">
        <PaymentSecurityNotice />
      </div>
    </div>
  );
}

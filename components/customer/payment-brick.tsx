'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, AlertCircle, ShieldCheck, MapPin, Search } from 'lucide-react';
import {
  processBrickPaymentAction,
  lookupCepAction,
  saveCustomerAddressAction,
} from '@/lib/mercadopago/actions';
import {
  type PaymentPreferenceData,
  type ProcessBrickPaymentResult,
  type BrickSubmitFormData,
  type BrickPayerAddress,
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

async function computeTruncatedHash(text: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 12);
  } catch {
    return text.substring(0, 12);
  }
}

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
  const [mountKey, setMountKey] = useState(0);
  const isSubmittingRef = useRef(false);
  const submitAttemptNumberRef = useRef(0);
  const brickControllerRef = useRef<MercadoPagoBrickController | null>(null);
  const containerId = 'mercadopago-payment-brick-container';

  // Address Fallback State (for Boleto if Mercado Pago postal lookup fails or requires manual completion)
  const [showAddressFallback, setShowAddressFallback] = useState(false);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(true);
  const [addressData, setAddressData] = useState<BrickPayerAddress>(() => ({
    zip_code: preference.payerAddress?.zipCode || '',
    street_name: preference.payerAddress?.streetName || '',
    street_number: preference.payerAddress?.streetNumber || '',
    neighborhood: preference.payerAddress?.neighborhood || '',
    city: preference.payerAddress?.city || '',
    federal_unit: preference.payerAddress?.federalUnit || '',
    complement: preference.payerAddress?.complement || '',
  }));

  const addressDataRef = useRef(addressData);
  const saveAddressToProfileRef = useRef(saveAddressToProfile);
  const isBrickReadyRef = useRef(false);

  useEffect(() => {
    addressDataRef.current = addressData;
  }, [addressData]);

  useEffect(() => {
    saveAddressToProfileRef.current = saveAddressToProfile;
  }, [saveAddressToProfile]);

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
      if (process.env.NODE_ENV === 'development') {
        console.info('[MP Brick]', {
          event: 'brick.sdk_initialized',
          consultationId: preference.consultationId,
        });
      }
      setIsSdkLoaded(true);
    };
    script.onerror = () => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[MP Brick]', {
          event: 'brick.critical_error',
          consultationId: preference.consultationId,
          errorMessage: 'Failed to load Mercado Pago SDK script',
        });
      }
      setBrickError('Falha ao carregar o módulo seguro de pagamentos do Mercado Pago.');
    };

    document.body.appendChild(script);

    return () => {
      if (!window.MercadoPago && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [preference.consultationId]);

  // 2. Initialize Payment Brick when SDK is ready
  useEffect(() => {
    if (!isSdkLoaded || !preference.publicKey || !window.MercadoPago) return;

    let isMounted = true;

    async function initBrick() {
      try {
        if (!window.MercadoPago) return;

        if (process.env.NODE_ENV === 'development') {
          console.info('[MP Brick]', {
            event: 'brick.initialization_started',
            consultationId: preference.consultationId,
            hasPublicKey: Boolean(preference.publicKey),
          });
        }

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
            ...(preference.preferenceId ? { preferenceId: preference.preferenceId } : {}),
            payer: {
              email: preference.payerEmail,
              ...(preference.payerAddress
                ? {
                    address: {
                      zipCode: preference.payerAddress.zipCode,
                      streetName: preference.payerAddress.streetName,
                      streetNumber: preference.payerAddress.streetNumber,
                      neighborhood: preference.payerAddress.neighborhood,
                      city: preference.payerAddress.city,
                      federalUnit: preference.payerAddress.federalUnit,
                      complement: preference.payerAddress.complement,
                    },
                  }
                : {}),
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
              isBrickReadyRef.current = true;
              if (process.env.NODE_ENV === 'development') {
                console.info('[MP Brick]', {
                  event: 'brick.ready',
                  consultationId: preference.consultationId,
                });
              }
              if (isMounted) setIsBrickReady(true);
            },
            onSubmit: ({ formData }: { formData: BrickSubmitFormData }) => {
              // Tarefa E: Bloquear double-submit no frontend
              if (isSubmittingRef.current || isProcessing) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('[MP Brick]', {
                    event: 'brick.submit_blocked_concurrent',
                    consultationId: preference.consultationId,
                  });
                }
                return Promise.reject(
                  new Error('Pagamento já em processamento. Aguarde alguns instantes.'),
                );
              }

              isSubmittingRef.current = true;
              submitAttemptNumberRef.current += 1;
              const tokenCreatedAt = Date.now();
              const token = formData?.token;

              return new Promise<void>((resolve, reject) => {
                startTransition(async () => {
                  try {
                    let tokenHashTruncated: string | undefined;
                    if (token) {
                      tokenHashTruncated = await computeTruncatedHash(token);
                    }

                    // Tarefa E: Registrar observabilidade segura no frontend
                    if (process.env.NODE_ENV === 'development') {
                      console.info('[MP Brick]', {
                        event: 'brick.submit_started',
                        consultationId: preference.consultationId,
                        tokenCreatedAt,
                        tokenLength: token ? token.length : 0,
                        tokenHashTruncado: tokenHashTruncated,
                        paymentMethodId: formData?.payment_method_id,
                        issuerPresent: Boolean(formData?.issuer_id),
                        installments: formData?.installments || 1,
                        submitAttemptNumber: submitAttemptNumberRef.current,
                      });
                    }

                    // Merge fallback address if provided and not present in formData
                    const isTicket =
                      formData.payment_method_id.toLowerCase().includes('bol') ||
                      formData.payment_method_id.toLowerCase().includes('ticket') ||
                      formData.payment_method_id.toLowerCase() === 'pec';

                    let finalAddress = formData.payer.address;
                    const currentAddress = addressDataRef.current;

                    if (
                      isTicket &&
                      (!finalAddress || !finalAddress.street_name || !finalAddress.city)
                    ) {
                      if (
                        currentAddress.zip_code &&
                        currentAddress.street_name &&
                        currentAddress.city &&
                        currentAddress.federal_unit
                      ) {
                        finalAddress = {
                          zip_code: currentAddress.zip_code.replace(/\D/g, ''),
                          street_name: currentAddress.street_name,
                          street_number: currentAddress.street_number || 'S/N',
                          neighborhood: currentAddress.neighborhood || 'Centro',
                          city: currentAddress.city,
                          federal_unit: currentAddress.federal_unit.toUpperCase(),
                          complement: currentAddress.complement,
                        };
                        formData.payer.address = finalAddress;
                      } else {
                        setShowAddressFallback(true);
                        toast.error(
                          'Por favor, preencha seu endereço completo para emitir o boleto bancário.',
                        );
                        reject();
                        return;
                      }
                    }

                    // Optionally persist address to customer profile
                    if (saveAddressToProfileRef.current && finalAddress && finalAddress.zip_code) {
                      saveCustomerAddressAction(finalAddress).catch((err) => {
                        console.warn('[saveCustomerAddressAction] silent notice:', err);
                      });
                    }

                    const clientTelemetry = {
                      tokenCreatedAt,
                      tokenLength: token ? token.length : undefined,
                      tokenHashTruncated,
                      submitAttemptNumber: submitAttemptNumberRef.current,
                    };

                    const result = await processBrickPaymentAction(
                      preference.consultationId,
                      formData,
                      undefined,
                      clientTelemetry,
                    );

                    if (process.env.NODE_ENV === 'development') {
                      console.info('[MP Brick]', {
                        event: 'brick.submit_received',
                        consultationId: preference.consultationId,
                        success: result.success,
                        status: result.status,
                      });
                    }

                    if (!result.success) {
                      // Tarefa E: Ao receber provider_error ou falha com token de cartão,
                      // desmontar/remontar o Brick para forçar novo token antes de novo submit
                      if (result.status === 'provider_error' || Boolean(formData?.token)) {
                        toast.error(
                          result.error ||
                            'Instabilidade técnica temporária. O formulário foi atualizado. Por favor, confirme os dados e tente novamente.',
                        );
                        setIsBrickReady(false);
                        setMountKey((prev) => prev + 1);
                      } else {
                        toast.error(
                          result.error ||
                            'Não foi possível processar o pagamento agora. Revise os dados informados e tente novamente.',
                        );
                      }

                      if (result.status === 'lookup_failed_refunded') {
                        onLookupFailedRefunded?.(result.error);
                      }
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
                      err instanceof Error
                        ? err.message
                        : 'Não foi possível processar o pagamento agora. Revise os dados informados e tente novamente.';
                    toast.error(errorMsg);
                    reject();
                  } finally {
                    isSubmittingRef.current = false;
                  }
                });
              });
            },
            onError: (error: unknown) => {
              const err = error as { cause?: string; message?: string; type?: string };
              const isNonCritical =
                err?.type === 'non_critical' ||
                err?.cause === 'get_address_data_failed' ||
                err?.cause === 'missing_payment_information';

              if (process.env.NODE_ENV === 'development') {
                if (isNonCritical) {
                  console.info('[MP Brick]', {
                    event: 'brick.non_critical_error',
                    consultationId: preference.consultationId,
                    errorCause: err?.cause,
                    errorType: err?.type,
                    errorMessage: err?.message,
                  });
                } else {
                  console.warn('[MP Brick]', {
                    event: 'brick.critical_error',
                    consultationId: preference.consultationId,
                    errorCause: err?.cause,
                    errorType: err?.type,
                    errorMessage: err?.message,
                  });
                }
              }

              // Non-critical events like get_address_data_failed must NOT tear down the Brick
              if (isNonCritical) {
                if (err?.cause === 'get_address_data_failed') {
                  setShowAddressFallback(true);
                }
                return;
              }

              // Only genuine critical loading failures display error card
              if (!isBrickReadyRef.current) {
                setBrickError(
                  'Não foi possível carregar as opções de pagamento agora. Tente novamente em instantes.',
                );
              }
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
      isBrickReadyRef.current = false;
      if (process.env.NODE_ENV === 'development') {
        console.info('[MP Brick]', {
          event: 'brick.unmounted',
          consultationId: preference.consultationId,
        });
      }
      if (brickControllerRef.current?.unmount) {
        try {
          brickControllerRef.current.unmount();
        } catch (unmountErr) {
          console.warn('[MP Brick] Unmount warning:', unmountErr);
        }
      }
    };
  }, [
    isSdkLoaded,
    preference.publicKey,
    preference.amount,
    preference.consultationId,
    preference.preferenceId,
    preference.payerEmail,
    preference.payerAddress,
    router,
    onPaymentSuccess,
    onAsyncPaymentCreated,
    onLookupFailedRefunded,
    mountKey,
  ]);

  // CEP Auto Lookup Handler for Boleto
  const handleCepLookup = async (cepInput: string) => {
    const cleanCep = cepInput.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const res = await lookupCepAction(cleanCep);
      if (res.success && res.data) {
        setAddressData((prev) => ({
          ...prev,
          zip_code: cleanCep,
          street_name: res.data?.street || prev.street_name,
          neighborhood: res.data?.neighborhood || prev.neighborhood,
          city: res.data?.city || prev.city,
          federal_unit: res.data?.state || prev.federal_unit,
        }));
        toast.success('Endereço localizado!');
      } else {
        toast.info(res.error || 'Preencha o endereço manualmente.');
      }
    } catch {
      toast.info('Preencha os dados de endereço manualmente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-white/[0.02] p-5 sm:p-6 border border-white/10 ${className}`}
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
            Selecione a forma de pagamento para liberar sua consulta.
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
          <div className="h-12 w-full rounded-xl bg-zinc-800/40" />
          <div className="h-12 w-full rounded-xl bg-zinc-800/20" />
          <div className="h-12 w-full rounded-xl bg-zinc-800/20" />
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

      {/* Processing overlay blocking duplicate submit */}
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

      {/* Address Fallback Form (for Boleto if required) */}
      {showAddressFallback && (
        <div className="my-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>Dados de endereço para emissão de boleto</span>
          </div>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            O Banco Central exige endereço completo para registro oficial do boleto. Preencha ou
            confirme seus dados:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="sm:col-span-1">
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">CEP</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  maxLength={9}
                  placeholder="00000-000"
                  value={addressData.zip_code}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAddressData((prev) => ({ ...prev, zip_code: val }));
                    if (val.replace(/\D/g, '').length === 8) {
                      handleCepLookup(val);
                    }
                  }}
                  onBlur={(e) => handleCepLookup(e.target.value)}
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none pr-7"
                />
                <div className="absolute right-2 text-zinc-400">
                  {isSearchingCep ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Logradouro</label>
              <input
                type="text"
                placeholder="Rua, Avenida..."
                value={addressData.street_name}
                onChange={(e) =>
                  setAddressData((prev) => ({ ...prev, street_name: e.target.value }))
                }
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Número</label>
              <input
                type="text"
                placeholder="123 ou S/N"
                value={addressData.street_number}
                onChange={(e) =>
                  setAddressData((prev) => ({ ...prev, street_number: e.target.value }))
                }
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">Bairro</label>
              <input
                type="text"
                placeholder="Bairro"
                value={addressData.neighborhood}
                onChange={(e) =>
                  setAddressData((prev) => ({ ...prev, neighborhood: e.target.value }))
                }
                className="w-full rounded-lg bg-zinc-900 border border-zinc-700/80 px-2.5 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-1">
              <label className="text-[10px] text-zinc-400 font-medium block mb-1">
                Cidade / UF
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Cidade"
                  value={addressData.city}
                  onChange={(e) => setAddressData((prev) => ({ ...prev, city: e.target.value }))}
                  className="flex-1 min-w-0 rounded-lg bg-zinc-900 border border-zinc-700/80 px-2 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="text"
                  maxLength={2}
                  placeholder="UF"
                  value={addressData.federal_unit}
                  onChange={(e) =>
                    setAddressData((prev) => ({
                      ...prev,
                      federal_unit: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-10 rounded-lg bg-zinc-900 border border-zinc-700/80 px-1 text-center text-xs text-white placeholder:text-zinc-600 focus:border-amber-500 focus:outline-none uppercase"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAddressToProfile}
              onChange={(e) => setSaveAddressToProfile(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0"
            />
            <span>Salvar este endereço no meu perfil para consultas futuras</span>
          </label>
        </div>
      )}

      {/* Official Mercado Pago Payment Brick Container - No restrictive overflow or height */}
      <div
        key={mountKey}
        id={containerId}
        className={!isBrickReady || brickError ? 'hidden' : 'w-full min-w-0 py-2'}
      />

      {/* Security Note Footer */}
      <div className="mt-4 pt-3 border-t border-zinc-800/60">
        <PaymentSecurityNotice
          isTestMode={
            preference.publicKey.startsWith('TEST-') || process.env.NODE_ENV === 'development'
          }
        />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentBrick } from './payment-brick';
import { PixPaymentDisplay } from './pix-payment-display';
import { BoletoPaymentDisplay } from './boleto-payment-display';
import { PaymentStatusBanner } from './payment-status-banner';
import { AutoRefundNotice } from './auto-refund-notice';
import { PaymentSimulation } from './payment-simulation';
import { VehicleConsultationOrderSummary } from './vehicle-consultation-order-summary';
import { VehicleConsultationBenefits } from './vehicle-consultation-benefits';
import { getPaymentStatus } from '@/lib/customer/payment-service';
import { type PaymentPreferenceData } from '@/lib/mercadopago/types';

interface CustomerPaymentFlowProps {
  preference: PaymentPreferenceData;
  initialConsultation: {
    id: string;
    plate: string;
    status: string;
    payment_status: string;
    auto_refund_attempted?: boolean | null;
    lookup_error_message?: string | null;
  };
  supportPhone?: string | null;
  allowDevSimulation?: boolean;
}

export function CustomerPaymentFlow({
  preference,
  initialConsultation,
  supportPhone,
  allowDevSimulation = false,
}: CustomerPaymentFlowProps) {
  const router = useRouter();
  const [asyncPaymentData, setAsyncPaymentData] = useState<{
    qrCode?: string;
    qrCodeBase64?: string;
    ticketUrl?: string;
    paymentId?: string;
  } | null>(null);
  const [currentStatus, setCurrentStatus] = useState(initialConsultation.status);
  const [paymentStatus, setPaymentStatus] = useState(initialConsultation.payment_status);
  const [hasAutoRefund, setHasAutoRefund] = useState(
    Boolean(initialConsultation.auto_refund_attempted),
  );
  const [lookupError, setLookupError] = useState(
    initialConsultation.lookup_error_message || undefined,
  );
  const [isCheckingStatus, startChecking] = useTransition();
  const [showDevSimulation, setShowDevSimulation] = useState(false);

  // Check if consultation is already completed
  const isCompleted = currentStatus === 'completed';

  // Manual or automatic status check
  const checkStatus = useCallback(() => {
    startChecking(async () => {
      try {
        const res = await getPaymentStatus(preference.consultationId);
        if (res.success && res.data) {
          setCurrentStatus(res.data.status);
          setPaymentStatus(res.data.paymentStatus);
          setHasAutoRefund(res.data.autoRefundAttempted);
          if (res.data.lookupErrorMessage) setLookupError(res.data.lookupErrorMessage);

          if (res.data.status === 'completed') {
            toast.success('Consulta veicular liberada com sucesso!');
            router.push(`/cliente/consultas/${preference.consultationId}`);
          } else if (res.data.autoRefundAttempted) {
            toast.info('Estorno automático registrado.');
          } else if (res.data.qrCode && !asyncPaymentData?.qrCode) {
            setAsyncPaymentData((prev) => ({
              ...prev,
              qrCode: res.data?.qrCode,
              qrCodeBase64: res.data?.qrCodeBase64,
            }));
          }
        }
      } catch (err) {
        console.error('Error checking payment status:', err);
      }
    });
  }, [asyncPaymentData, preference.consultationId, router]);

  // Poll status every 8s if async payment is pending
  useEffect(() => {
    if (isCompleted || hasAutoRefund || (!asyncPaymentData && paymentStatus !== 'paid')) return;

    const interval = setInterval(() => {
      checkStatus();
    }, 8000);

    return () => clearInterval(interval);
  }, [asyncPaymentData, isCompleted, hasAutoRefund, paymentStatus, checkStatus]);

  // If already auto-refunded
  if (hasAutoRefund) {
    return (
      <div className="mx-auto max-w-xl py-6 sm:py-10">
        <AutoRefundNotice
          plate={preference.plate}
          consultationId={preference.consultationId}
          errorMessage={lookupError}
          supportPhone={supportPhone}
        />
      </div>
    );
  }

  // If already completed
  if (isCompleted) {
    return (
      <div className="mx-auto max-w-lg text-center rounded-2xl bg-white/[0.02] border border-emerald-500/30 p-8 shadow-xl">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Consulta Concluída!</h2>
        <p className="text-sm text-zinc-300 mb-6">
          O laudo veicular da placa{' '}
          <span className="font-mono font-bold text-emerald-400">{preference.plate}</span> já está
          disponível para visualização e download no seu painel.
        </p>
        <Link
          href={`/cliente/consultas/${preference.consultationId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition-colors"
        >
          Visualizar Laudo Completo
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top Navigation */}
      <nav aria-label="Navegação da etapa de pagamento" className="flex items-center">
        <Link
          href="/cliente"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500 rounded py-1 px-1 -ml-1"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao painel
        </Link>
      </nav>

      {/* Header Title */}
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Finalize sua consulta
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Receba o histórico veicular completo da placa informada.
        </p>
      </header>

      {/* Main Composition: 1 column on Mobile, 2 columns on Desktop (lg+) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left Column (Desktop) / Top Section (Mobile): Resumo e Benefícios */}
        <div className="lg:col-span-5 space-y-5">
          <VehicleConsultationOrderSummary plate={preference.plate} amount={preference.amount} />
          <VehicleConsultationBenefits supportPhone={supportPhone} plate={preference.plate} />
        </div>

        {/* Right Column (Desktop) / Bottom Section (Mobile): Área de Pagamento */}
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* Status banner if async payment is pending */}
          {asyncPaymentData && (
            <PaymentStatusBanner
              status="pending"
              onRefresh={checkStatus}
              isRefreshing={isCheckingStatus}
            />
          )}

          {/* Async Boleto Display */}
          {asyncPaymentData?.ticketUrl ? (
            <BoletoPaymentDisplay
              ticketUrl={asyncPaymentData.ticketUrl}
              onRefreshStatus={checkStatus}
              isChecking={isCheckingStatus}
            />
          ) : asyncPaymentData?.qrCode ? (
            /* Async Pix Display */
            <PixPaymentDisplay
              qrCode={asyncPaymentData.qrCode}
              qrCodeBase64={asyncPaymentData.qrCodeBase64}
              onRefreshStatus={checkStatus}
              isChecking={isCheckingStatus}
            />
          ) : (
            /* Mercado Pago Payment Brick */
            <PaymentBrick
              preference={preference}
              onPaymentSuccess={() => {
                setCurrentStatus('completed');
              }}
              onAsyncPaymentCreated={(result) => {
                setAsyncPaymentData({
                  qrCode: result.qrCode,
                  qrCodeBase64: result.qrCodeBase64,
                  ticketUrl: result.ticketUrl,
                  paymentId: result.paymentId,
                });
              }}
              onLookupFailedRefunded={(errorMsg) => {
                setHasAutoRefund(true);
                if (errorMsg) setLookupError(errorMsg);
              }}
            />
          )}
        </div>
      </div>

      {/* Optional Development Simulation Accordion */}
      {allowDevSimulation && (
        <div className="pt-6 border-t border-zinc-900 mt-8">
          <button
            onClick={() => setShowDevSimulation(!showDevSimulation)}
            className="flex items-center justify-between w-full text-xs text-zinc-500 hover:text-zinc-400 py-2 rounded focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500"
            aria-expanded={showDevSimulation}
          >
            <span>🛠️ Ambiente de Desenvolvimento: Simulação Local</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showDevSimulation ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {showDevSimulation && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-950 p-5">
              <p className="text-xs text-zinc-400 mb-4">
                Esta seção só aparece quando <code>ENABLE_DEV_PAYMENT_SIMULATION=true</code> e{' '}
                <code>NODE_ENV=development</code>.
              </p>
              <PaymentSimulation
                consultation={{
                  id: preference.consultationId,
                  plate: preference.plate,
                  status: currentStatus,
                  payment_status: paymentStatus,
                }}
                price={preference.amount}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

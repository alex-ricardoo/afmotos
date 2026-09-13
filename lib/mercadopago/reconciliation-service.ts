import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentClient } from './client.ts';
import { fetchAuthoritativePayment } from './webhook-service.ts';
import { confirmAndProcessPaymentTransaction } from './payment-processing-service.ts';
import { logCheckoutProEvent } from './observability.ts';
import { type PaymentTransactionStatus } from './types.ts';

export interface ReconciliationResult {
  success: boolean;
  transactionId: string;
  previousStatus: PaymentTransactionStatus;
  currentStatus: PaymentTransactionStatus;
  reconciled: boolean;
  reportUnlocked?: boolean;
  message: string;
  error?: string;
}

/**
 * Reconcilia de forma autoritativa uma transação de pagamento consultando
 * diretamente a API oficial do Mercado Pago e reutilizando a rotina transacional central.
 */
export async function reconcilePaymentTransaction(
  transactionId: string,
  actorId?: string,
  actorType: 'admin' | 'customer' | 'system' = 'customer',
): Promise<ReconciliationResult> {
  const adminDb = createAdminClient();

  logCheckoutProEvent('checkout_pro.reconciliation_started', {
    transactionId,
  });

  // 1. Carrega a transação existente
  const { data: transaction, error: txError } = await adminDb
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    return {
      success: false,
      transactionId,
      previousStatus: 'pending',
      currentStatus: 'pending',
      reconciled: false,
      message: 'Transação não encontrada no banco de dados.',
    };
  }

  const previousStatus = transaction.status as PaymentTransactionStatus;

  // Se a transação já estiver aprovada e a consulta concluída, responde imediatamente
  if (previousStatus === 'approved') {
    const { data: consultation } = await adminDb
      .from('customer_plate_consultations')
      .select('status, vehicle_data')
      .eq('id', transaction.consultation_id)
      .maybeSingle();

    if (consultation?.status === 'completed' && consultation?.vehicle_data) {
      return {
        success: true,
        transactionId,
        previousStatus,
        currentStatus: 'approved',
        reconciled: true,
        reportUnlocked: true,
        message: 'Transação já aprovada e laudo veicular liberado.',
      };
    }
  }

  let paymentIdToFetch = transaction.mp_payment_id;

  // 2. Se não possuir mp_payment_id gravado, busca via search por external_reference no MP
  if (!paymentIdToFetch) {
    try {
      const paymentClient = getPaymentClient();
      const searchResult = await paymentClient.search({
        options: {
          external_reference: transaction.id,
        },
      });

      const firstResult = searchResult.results?.[0];
      if (firstResult && firstResult.id) {
        paymentIdToFetch = String(firstResult.id);
      }
    } catch (err) {
      console.warn('[reconcilePaymentTransaction] Falha ao buscar por external_reference:', err);
    }
  }

  if (!paymentIdToFetch) {
    return {
      success: false,
      transactionId,
      previousStatus,
      currentStatus: previousStatus,
      reconciled: false,
      message: 'Nenhum pagamento correspondente identificado no Mercado Pago no momento.',
    };
  }

  // 3. Consulta autoritativa no Mercado Pago
  let paymentData;
  try {
    paymentData = await fetchAuthoritativePayment(paymentIdToFetch);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Falha na requisição ao Mercado Pago';
    return {
      success: false,
      transactionId,
      previousStatus,
      currentStatus: previousStatus,
      reconciled: false,
      message: `Erro ao consultar Mercado Pago: ${errMsg}`,
      error: errMsg,
    };
  }

  // 4. Executa a confirmação centralizada compartilhada
  const confirmation = await confirmAndProcessPaymentTransaction({
    transaction,
    paymentData,
    actorType,
    actorId,
  });

  logCheckoutProEvent('checkout_pro.reconciliation_completed', {
    transactionId: transaction.id,
    paymentId: paymentData.id,
    status: confirmation.currentStatus,
  });

  return {
    success: confirmation.success,
    transactionId,
    previousStatus,
    currentStatus: confirmation.currentStatus,
    reconciled: confirmation.success,
    reportUnlocked: confirmation.reportUnlocked,
    message: confirmation.message,
    error: confirmation.error,
  };
}

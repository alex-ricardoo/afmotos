import { createAdminClient } from '@/lib/supabase/admin';
import { getPaymentClient } from './client.ts';
import { fetchAuthoritativePayment } from './webhook-service.ts';
import { mapMercadoPagoStatus, canTransitionStatus } from './payment-status-mapper.ts';
import { releaseVerifiedPaidConsultation } from './consultation-releaser.ts';
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
}

/**
 * Reconcilia de forma autoritativa uma transação de pagamento pendente ou ambígua
 * consultando diretamente a API oficial do Mercado Pago.
 */
export async function reconcilePaymentTransaction(
  transactionId: string,
  adminUserId: string,
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
  let paymentIdToFetch = transaction.mp_payment_id;

  // 2. Se não possuir mp_payment_id gravado, tenta buscar pelo external_reference no MP
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
      message:
        'Nenhum identificador de pagamento encontrado para reconciliação com o Mercado Pago.',
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
    };
  }

  // 4. Mapeamento e transição de status
  const newStatus = mapMercadoPagoStatus(paymentData.status);
  let reportUnlocked = false;

  if (canTransitionStatus(previousStatus, newStatus)) {
    await adminDb
      .from('payment_transactions')
      .update({
        mp_payment_id: paymentData.id,
        status: newStatus,
        status_detail: paymentData.statusDetail,
        payment_method_id: paymentData.paymentMethodId || transaction.payment_method_id,
        payment_type_id: paymentData.paymentTypeId || transaction.payment_type_id,
        payer_email: paymentData.payerEmail || transaction.payer_email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (newStatus === 'approved') {
      const releaseOutcome = await releaseVerifiedPaidConsultation(transaction.id);
      reportUnlocked = releaseOutcome.success;
    }
  }

  // 5. Trilha de auditoria administrativa
  await adminDb.from('consultation_audit_logs').insert({
    consultation_id: transaction.consultation_id,
    transaction_id: transaction.id,
    actor_id: adminUserId,
    actor_type: 'admin',
    event: 'admin_reconciliation_executed',
    details: {
      mp_payment_id: paymentData.id,
      previous_status: previousStatus,
      new_status: newStatus,
      report_unlocked: reportUnlocked,
    },
  });

  logCheckoutProEvent('checkout_pro.reconciliation_completed', {
    transactionId: transaction.id,
    paymentId: paymentData.id,
    status: newStatus,
  });

  return {
    success: true,
    transactionId,
    previousStatus,
    currentStatus: newStatus,
    reconciled: true,
    reportUnlocked,
    message: `Reconciliação concluída com sucesso. Status atual: ${newStatus}.`,
  };
}

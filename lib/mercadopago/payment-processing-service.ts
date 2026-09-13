import { createAdminClient } from '../supabase/admin.ts';
import { mapMercadoPagoStatus, canTransitionStatus } from './payment-status-mapper.ts';
import { releaseVerifiedPaidConsultation } from './consultation-releaser.ts';
import { logCheckoutProEvent } from './observability.ts';
import { type PaymentTransactionStatus, type PaymentTransactionRecord } from './types.ts';

export interface AuthoritativePaymentData {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  transactionAmount: number;
  paymentMethodId: string | null;
  paymentTypeId: string | null;
  payerEmail: string | null;
  rawResponse?: Record<string, unknown>;
}

export interface ProcessPaymentConfirmationParams {
  transaction:
    | PaymentTransactionRecord
    | {
        id: string;
        consultation_id: string;
        user_id: string;
        status: string;
        transaction_amount: number | string;
        mp_payment_id?: string | null;
        payment_method_id?: string | null;
        payment_type_id?: string | null;
        payer_email?: string | null;
      };
  paymentData: AuthoritativePaymentData;
  actorType: 'webhook' | 'customer' | 'admin' | 'system';
  actorId?: string | null;
  flowId?: string;
  dbClient?: unknown;
}

export interface ProcessPaymentConfirmationResult {
  success: boolean;
  transactionId: string;
  previousStatus: PaymentTransactionStatus;
  currentStatus: PaymentTransactionStatus;
  statusChanged: boolean;
  reportUnlocked: boolean;
  message: string;
  error?: string;
}

/**
 * Função centralizada e atômica para confirmação autoritativa de pagamento.
 * Compartilhada estritamente entre o Webhook e a Reconciliação sob demanda.
 *
 * Garante:
 * 1. Validação de correspondência de valor (em centavos) e referência externa.
 * 2. Prevenção de downgrade de estado (ex.: approved para pending).
 * 3. Persistência atômica do mp_payment_id e status normalizado no Supabase.
 * 4. Desbloqueio e execução da consulta veicular exatamente uma vez.
 * 5. Registro na trilha de auditoria (consultation_audit_logs).
 */
export async function confirmAndProcessPaymentTransaction({
  transaction,
  paymentData,
  actorType,
  actorId,
  flowId,
  dbClient,
}: ProcessPaymentConfirmationParams): Promise<ProcessPaymentConfirmationResult> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();
  const previousStatus = transaction.status as PaymentTransactionStatus;

  // 1. Validação de Referência Externa
  if (paymentData.externalReference && paymentData.externalReference !== transaction.id) {
    const mismatchMsg = `external_reference do provedor (${paymentData.externalReference}) diverge da transação interna (${transaction.id}).`;
    logCheckoutProEvent(
      'checkout_pro.transaction_updated',
      {
        flowId,
        transactionId: transaction.id,
        paymentId: paymentData.id,
        errorMessage: mismatchMsg,
      },
      'warn',
    );
    return {
      success: false,
      transactionId: transaction.id,
      previousStatus,
      currentStatus: previousStatus,
      statusChanged: false,
      reportUnlocked: false,
      message: 'Referência externa divergente.',
      error: mismatchMsg,
    };
  }

  // 2. Validação de Valor em Centavos
  const paymentCents = Math.round(paymentData.transactionAmount * 100);
  const transactionCents = Math.round(Number(transaction.transaction_amount) * 100);

  if (paymentCents !== transactionCents) {
    const amountMismatchMsg = `Valor do pagamento (R$ ${paymentData.transactionAmount}) diverge do valor registrado (R$ ${transaction.transaction_amount}).`;
    logCheckoutProEvent(
      'checkout_pro.transaction_updated',
      {
        flowId,
        transactionId: transaction.id,
        paymentId: paymentData.id,
        errorMessage: amountMismatchMsg,
      },
      'warn',
    );
    return {
      success: false,
      transactionId: transaction.id,
      previousStatus,
      currentStatus: previousStatus,
      statusChanged: false,
      reportUnlocked: false,
      message: 'Valor monetário divergente.',
      error: amountMismatchMsg,
    };
  }

  // 3. Mapeamento de Status e Validação de Transição
  const newStatus = mapMercadoPagoStatus(paymentData.status);
  let statusChanged = false;
  let reportUnlocked = false;

  if (canTransitionStatus(previousStatus, newStatus)) {
    const { error: updateError } = await adminDb
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

    if (updateError) {
      return {
        success: false,
        transactionId: transaction.id,
        previousStatus,
        currentStatus: previousStatus,
        statusChanged: false,
        reportUnlocked: false,
        message: 'Falha ao atualizar status da transação no banco de dados.',
        error: updateError.message,
      };
    }

    statusChanged = true;

    logCheckoutProEvent('checkout_pro.transaction_updated', {
      flowId,
      transactionId: transaction.id,
      paymentId: paymentData.id,
      status: newStatus,
      statusDetail: paymentData.statusDetail || undefined,
    });
  }

  // 4. Se o pagamento estiver aprovado, aciona a liberação atômica da consulta
  const effectiveStatus = statusChanged ? newStatus : previousStatus;
  if (effectiveStatus === 'approved') {
    const releaseOutcome = await releaseVerifiedPaidConsultation(transaction.id, adminDb);
    reportUnlocked = releaseOutcome.success;
  }

  // 5. Trilha de Auditoria
  await adminDb.from('consultation_audit_logs').insert({
    consultation_id: transaction.consultation_id,
    transaction_id: transaction.id,
    actor_id: actorId || null,
    actor_type: actorType,
    event:
      actorType === 'webhook' ? 'webhook_payment_confirmed' : 'reconciliation_payment_confirmed',
    details: {
      mp_payment_id: paymentData.id,
      previous_status: previousStatus,
      new_status: effectiveStatus,
      status_changed: statusChanged,
      report_unlocked: reportUnlocked,
      actor_type: actorType,
    },
  });

  return {
    success: true,
    transactionId: transaction.id,
    previousStatus,
    currentStatus: effectiveStatus,
    statusChanged,
    reportUnlocked,
    message:
      effectiveStatus === 'approved'
        ? 'Pagamento aprovado e consulta liberada com sucesso.'
        : `Pagamento atualizado com status: ${effectiveStatus}.`,
  };
}

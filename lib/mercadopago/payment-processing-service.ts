import { createAdminClient } from '../supabase/admin.ts';
import { mapMercadoPagoStatus, canTransitionStatus } from './payment-status-mapper.ts';
import { releaseVerifiedPaidConsultation } from './consultation-releaser.ts';
import { logCheckoutProEvent } from './observability.ts';
import { isBoletoPayment } from './payment-method-policy.ts';
import { type PaymentTransactionStatus, type PaymentTransactionRecord } from './types.ts';

export interface AuthoritativePaymentData {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  preferenceId?: string | null;
  metadata?: Record<string, unknown> | null;
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
        consultation_id?: string | null;
        purpose?: string | null;
        credit_package_order_id?: string | null;
        user_id: string;
        status: string;
        transaction_amount: number | string;
        mp_payment_id?: string | null;
        mp_preference_id?: string | null;
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
  packageGranted?: boolean;
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
 * 4. Desbloqueio e execução da consulta veicular OU concessão atômica de pacote de créditos.
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

  // 1. Validação de Referência Externa (suporta tanto transaction.id quanto credit_package_order_id e metadata)
  const metadataOrderId =
    typeof paymentData.metadata?.order_id === 'string' ? paymentData.metadata.order_id : null;

  const matchesRef =
    !paymentData.externalReference ||
    paymentData.externalReference === transaction.id ||
    (Boolean(transaction.credit_package_order_id) &&
      paymentData.externalReference === transaction.credit_package_order_id) ||
    (Boolean(transaction.credit_package_order_id) &&
      metadataOrderId === transaction.credit_package_order_id);

  if (!matchesRef) {
    const mismatchMsg = `external_reference do provedor (${paymentData.externalReference}) diverge da transação interna (${transaction.id}) e do pedido de pacote (${transaction.credit_package_order_id || 'n/a'}).`;
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

  // Detecção e observabilidade segura para pagamentos offline/boleto não permitidos
  if (isBoletoPayment(paymentData.paymentTypeId, paymentData.paymentMethodId)) {
    logCheckoutProEvent(
      'checkout_pro.unexpected_ticket_payment_detected',
      {
        flowId,
        transactionId: transaction.id,
        paymentId: paymentData.id,
        paymentTypeId: paymentData.paymentTypeId || 'unknown',
        paymentMethodId: paymentData.paymentMethodId || 'unknown',
        status: newStatus,
      },
      'warn',
    );
  }

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

  // 4. Se o pagamento estiver aprovado, aciona a liberação apropriada pelo propósito (purpose)
  const isCreditPackage =
    transaction.purpose === 'credit_package' || Boolean(transaction.credit_package_order_id);
  const effectiveStatus = statusChanged ? newStatus : previousStatus;
  let packageGranted = false;

  if (effectiveStatus === 'approved') {
    if (isCreditPackage && transaction.credit_package_order_id) {
      const nowIso = new Date().toISOString();

      // 4a. Atualiza o pedido de pacote para 'paid' com paid_at oficial
      const { error: orderUpdateErr } = await adminDb
        .from('credit_package_orders')
        .update({
          status: 'paid',
          mp_payment_id: paymentData.id,
          paid_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', transaction.credit_package_order_id);

      if (orderUpdateErr) {
        logCheckoutProEvent(
          'credit_package.order_update_failed',
          {
            flowId,
            orderId: transaction.credit_package_order_id,
            errorMessage: orderUpdateErr.message,
          },
          'error',
        );

        // Persistir auditoria de falha no banco para rastreabilidade operacional
        await adminDb.from('consultation_audit_logs').insert({
          consultation_id: null,
          transaction_id: transaction.id,
          actor_id: actorId || null,
          actor_type: actorType,
          event: 'credit_package_order_update_failed',
          details: {
            order_id: transaction.credit_package_order_id,
            mp_payment_id: paymentData.id,
            error_message: orderUpdateErr.message,
            origin: actorType,
          },
        });

        // NÃO chamar a RPC se o update da ordem falhou
        return {
          success: false,
          transactionId: transaction.id,
          previousStatus,
          currentStatus: effectiveStatus,
          statusChanged,
          reportUnlocked: false,
          packageGranted: false,
          message: 'Falha ao atualizar status do pedido de pacote para pago.',
          error: orderUpdateErr.message,
        };
      }

      // 4b. Concessão atômica e idempotente via RPC
      const { data: rpcData, error: rpcError } = await adminDb.rpc(
        'grant_credit_package_from_paid_order',
        {
          p_order_id: transaction.credit_package_order_id,
        },
      );

      const rpcResult = rpcData as { success?: boolean; code?: string; message?: string } | null;

      if (rpcError || (rpcResult && rpcResult.success === false)) {
        const errorMsg =
          rpcError?.message ||
          rpcResult?.message ||
          'Falha ao conceder pacote de créditos via RPC.';
        logCheckoutProEvent(
          'credit_package.grant_failed',
          {
            flowId,
            orderId: transaction.credit_package_order_id,
            transactionId: transaction.id,
            paymentId: paymentData.id,
            errorMessage: errorMsg,
            rpcCode: rpcResult?.code,
          },
          'error',
        );

        // Persistir auditoria de falha da RPC no banco (não apenas Vercel logs)
        await adminDb.from('consultation_audit_logs').insert({
          consultation_id: null,
          transaction_id: transaction.id,
          actor_id: actorId || null,
          actor_type: actorType,
          event: 'credit_package_grant_failed',
          details: {
            order_id: transaction.credit_package_order_id,
            mp_payment_id: paymentData.id,
            error_message: errorMsg,
            rpc_code: rpcResult?.code || 'RPC_ERROR',
            origin: actorType,
          },
        });

        return {
          success: false,
          transactionId: transaction.id,
          previousStatus,
          currentStatus: effectiveStatus,
          statusChanged,
          reportUnlocked: false,
          packageGranted: false,
          message: errorMsg,
          error: errorMsg,
        };
      } else {
        packageGranted = true;
        logCheckoutProEvent('credit_package.payment_confirmed', {
          flowId,
          orderId: transaction.credit_package_order_id,
          transactionId: transaction.id,
          paymentId: paymentData.id,
          status: effectiveStatus,
        });
      }
    } else if (transaction.consultation_id) {
      const releaseOutcome = await releaseVerifiedPaidConsultation(transaction.id, adminDb);
      reportUnlocked = releaseOutcome.success;
    }
  } else if (effectiveStatus === 'refunded') {
    const nowIso = new Date().toISOString();

    if (isCreditPackage && transaction.credit_package_order_id) {
      await adminDb
        .from('credit_package_orders')
        .update({
          status: 'refunded',
          updated_at: nowIso,
        })
        .eq('id', transaction.credit_package_order_id);
    } else if (transaction.consultation_id) {
      await adminDb
        .from('customer_plate_consultations')
        .update({
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: nowIso,
        })
        .eq('id', transaction.consultation_id);

      await adminDb
        .from('consultation_delivery_jobs')
        .update({
          status: 'failed_permanent',
          last_error_code: 'TRANSACTION_REFUNDED',
          last_error_message_safe: 'Transação estornada; entrega cancelada.',
          failed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('transaction_id', transaction.id)
        .in('status', ['pending', 'processing', 'retry_scheduled']);
    }
  }

  // 5. Trilha de Auditoria
  if (isCreditPackage) {
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: transaction.consultation_id || null,
      transaction_id: transaction.id,
      actor_id: actorId || null,
      actor_type: actorType,
      event:
        actorType === 'webhook'
          ? 'credit_package_payment_confirmed'
          : 'credit_package_reconciliation_payment_confirmed',
      details: {
        mp_payment_id: paymentData.id,
        order_id: transaction.credit_package_order_id,
        previous_status: previousStatus,
        new_status: effectiveStatus,
        status_changed: statusChanged,
        package_granted: packageGranted,
        actor_type: actorType,
      },
    });
  } else if (transaction.consultation_id) {
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
  }

  return {
    success: true,
    transactionId: transaction.id,
    previousStatus,
    currentStatus: effectiveStatus,
    statusChanged,
    reportUnlocked,
    packageGranted,
    message:
      effectiveStatus === 'approved'
        ? isCreditPackage
          ? 'Pagamento aprovado e créditos do pacote liberados com sucesso.'
          : 'Pagamento aprovado e consulta liberada com sucesso.'
        : `Pagamento atualizado com status: ${effectiveStatus}.`,
  };
}

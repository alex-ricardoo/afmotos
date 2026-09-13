import { createAdminClient } from '../supabase/admin.ts';
import { getMercadoPagoConfig } from './client.ts';
import { PaymentRefund } from 'mercadopago';
import { logCheckoutProEvent, maskId } from './observability.ts';
import { type PaymentRefundRecord } from './types.ts';

export interface InitiateRefundParams {
  transactionId: string;
  consultationId: string;
  reasonCode: string;
  reasonSafe: string;
  dbClient?: unknown;
}

export interface InitiateRefundResult {
  success: boolean;
  refundId: string;
  providerRefundId?: string;
  status: 'requested' | 'pending' | 'confirmed' | 'failed' | 'manual_review';
  alreadyProcessed: boolean;
  message: string;
  error?: string;
}

export interface RefundEligibilityParams {
  transaction: {
    id: string;
    payment_status?: string;
    status?: string;
    mp_payment_id?: string | null;
    amount?: number;
    transaction_amount?: number;
  };
  consultation: {
    id: string;
    status?: string;
    report_data?: unknown;
    vehicle_data?: unknown;
  };
  existingRefund?: {
    id: string;
    status: string;
  } | null;
}

/**
 * Valida de forma pura e estrita se uma transação e consulta são elegíveis para estorno total.
 */
export function evaluateRefundEligibility({
  transaction,
  consultation,
  existingRefund,
}: RefundEligibilityParams): { eligible: boolean; reason: string | null } {
  const currentStatus = transaction.payment_status || transaction.status;
  if (currentStatus !== 'approved') {
    return {
      eligible: false,
      reason: `Pagamento não está aprovado (status: ${currentStatus || 'desconhecido'}).`,
    };
  }

  if (!transaction.mp_payment_id) {
    return {
      eligible: false,
      reason: 'Identificador oficial do Mercado Pago (mp_payment_id) ausente na transação.',
    };
  }

  const hasDeliveredReport =
    consultation.status === 'completed' &&
    Boolean(consultation.report_data || consultation.vehicle_data);

  if (hasDeliveredReport) {
    return {
      eligible: false,
      reason: 'Laudo já foi entregue com sucesso; estorno automático bloqueado.',
    };
  }

  if (existingRefund && ['requested', 'pending', 'confirmed'].includes(existingRefund.status)) {
    return {
      eligible: false,
      reason: `Estorno já foi solicitado ou concluído anteriormente (status: ${existingRefund.status}).`,
    };
  }

  return {
    eligible: true,
    reason: null,
  };
}

/**
 * Constrói a chave determinística de idempotência para o cabeçalho X-Idempotency-Key
 */
export function buildRefundIdempotencyKey(transactionId: string, mpPaymentId: string): string {
  return `refund-${transactionId}-${mpPaymentId}`;
}

/**
 * Higieniza qualquer mensagem de erro do fluxo de estorno, removendo tokens ou credenciais.
 */
export function sanitizeRefundErrorMessage(rawMessage: string): string {
  if (!rawMessage) return 'Erro desconhecido durante o processamento do estorno.';
  return rawMessage
    .replace(/APP_USR-[a-zA-Z0-9_-]+/g, '[REDACTED_SECRET]')
    .replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer [REDACTED]')
    .replace(/[a-f0-9]{32,64}/gi, (match) => match.length >= 32 ? '[REDACTED_HASH]' : match);
}

/**
 * Inicia o processo atômico e idempotente de estorno integral no Mercado Pago
 * após falha definitiva na entrega do laudo veicular.
 */
export async function initiateRefundForFailedDelivery({
  transactionId,
  consultationId,
  reasonCode,
  reasonSafe,
  dbClient,
}: InitiateRefundParams): Promise<InitiateRefundResult> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();
  const startTime = Date.now();

  logCheckoutProEvent('checkout_pro.transaction_updated', {
    transactionId,
    consultationId,
    errorMessage: `[PAYMENT_REFUND] Início de elegibilidade de estorno: motivo=${reasonCode}`,
  });

  // 1. Carrega a transação de pagamento
  const { data: transaction, error: txError } = await adminDb
    .from('payment_transactions')
    .select('*')
    .eq('id', transactionId)
    .maybeSingle();

  if (txError || !transaction) {
    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: false,
      message: 'Transação de pagamento não encontrada.',
      error: txError?.message || 'Transaction not found',
    };
  }

  // Precondição estrita: status deve ser approved e possuir mp_payment_id
  if (transaction.status !== 'approved') {
    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: false,
      message: `Transação não está em estado elegível para refund (status: ${transaction.status}).`,
    };
  }

  if (!transaction.mp_payment_id) {
    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: false,
      message: 'Transação não possui mp_payment_id oficial do Mercado Pago.',
    };
  }

  // 2. Carrega a consulta veicular correspondente
  const { data: consultation, error: consError } = await adminDb
    .from('customer_plate_consultations')
    .select('id, status, vehicle_data')
    .eq('id', consultationId)
    .maybeSingle();

  if (consError || !consultation) {
    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: false,
      message: 'Consulta vinculada não encontrada.',
    };
  }

  // Se o laudo foi gerado e está concluído, nunca estornar automaticamente
  if (consultation.status === 'completed' && consultation.vehicle_data) {
    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: true,
      message: 'Consulta já concluída com laudo válido; estorno automático bloqueado.',
    };
  }

  // 3. Verifica se já existe ordem de refund ativa ou confirmada
  const { data: existingRefund } = await adminDb
    .from('payment_refunds')
    .select('*')
    .eq('transaction_id', transaction.id)
    .in('status', ['requested', 'pending', 'confirmed'])
    .maybeSingle();

  if (existingRefund) {
    logCheckoutProEvent('checkout_pro.transaction_updated', {
      transactionId: transaction.id,
      paymentId: transaction.mp_payment_id,
      errorMessage: `[PAYMENT_REFUND] Estorno duplicado ignorado. Já existe refund ID ${existingRefund.id} com status ${existingRefund.status}.`,
    });

    return {
      success: true,
      refundId: existingRefund.id,
      providerRefundId: existingRefund.provider_refund_id || undefined,
      status: existingRefund.status,
      alreadyProcessed: true,
      message: 'Estorno já registrado ou em andamento.',
    };
  }

  const amountCents = Math.round(Number(transaction.transaction_amount) * 100);
  if (amountCents <= 0) {
    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: false,
      message: 'Valor da transação inválido para estorno.',
    };
  }

  // 4. Cria o registro de refund com status 'requested' (Atômico)
  const { data: newRefund, error: createError } = await adminDb
    .from('payment_refunds')
    .insert({
      transaction_id: transaction.id,
      consultation_id: consultation.id,
      provider: 'mercadopago',
      provider_payment_id: transaction.mp_payment_id,
      amount_cents: amountCents,
      currency: 'BRL',
      status: 'requested',
      reason_code: reasonCode,
      reason_safe: reasonSafe,
      request_attempts: 1,
      requested_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (createError || !newRefund) {
    // Pode ter ocorrido colisão por índice único concorrente
    const { data: collidingRefund } = await adminDb
      .from('payment_refunds')
      .select('*')
      .eq('transaction_id', transaction.id)
      .maybeSingle();

    if (collidingRefund) {
      return {
        success: true,
        refundId: collidingRefund.id,
        status: collidingRefund.status,
        alreadyProcessed: true,
        message: 'Estorno já existente criado por outro processo concorrente.',
      };
    }

    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: false,
      message: 'Falha ao registrar solicitação de estorno no banco de dados.',
      error: createError?.message,
    };
  }

  // Atualiza status da consulta para refund_pending
  await adminDb
    .from('customer_plate_consultations')
    .update({
      status: 'refund_pending',
      auto_refund_attempted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', consultation.id);

  // 5. Chamada Autoritativa à API do Mercado Pago (PaymentRefund.total)
  let providerRefundId: string | null = null;
  try {
    const mpConfig = getMercadoPagoConfig();
    const refundClient = new PaymentRefund(mpConfig);

    const paymentIdNum = Number(transaction.mp_payment_id);
    if (isNaN(paymentIdNum)) {
      throw new Error(`Identificador mp_payment_id inválido: ${transaction.mp_payment_id}`);
    }

    const mpRefundResponse = await refundClient.total({
      payment_id: paymentIdNum,
    });

    if (mpRefundResponse && mpRefundResponse.id) {
      providerRefundId = String(mpRefundResponse.id);
    }

    // Atualiza status do refund para pending (aguardando consolidação definitiva do gateway)
    await adminDb
      .from('payment_refunds')
      .update({
        status: 'pending',
        provider_refund_id: providerRefundId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', newRefund.id);

    // Auditoria
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transaction.id,
      actor_type: 'system',
      event: 'refund_requested',
      details: {
        refund_id: newRefund.id,
        provider_refund_id: providerRefundId,
        mp_payment_id: transaction.mp_payment_id,
        amount_cents: amountCents,
        reason_code: reasonCode,
        duration_ms: Date.now() - startTime,
      },
    });

    return {
      success: true,
      refundId: newRefund.id,
      providerRefundId: providerRefundId || undefined,
      status: 'pending',
      alreadyProcessed: false,
      message: 'Solicitação de estorno enviada com sucesso ao Mercado Pago.',
    };
  } catch (mpErr: any) {
    const errorErrMsg = mpErr instanceof Error ? mpErr.message : String(mpErr);
    console.error('[initiateRefundForFailedDelivery] Erro ao chamar Mercado Pago refund:', errorErrMsg);

    await adminDb
      .from('payment_refunds')
      .update({
        status: 'failed',
        last_error_code: 'MP_REFUND_API_ERROR',
        last_error_safe: 'Instabilidade técnica na comunicação com o Mercado Pago para estorno.',
        failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', newRefund.id);

    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transaction.id,
      actor_type: 'system',
      event: 'refund_failed',
      details: {
        refund_id: newRefund.id,
        mp_payment_id: transaction.mp_payment_id,
        reason_code: reasonCode,
        error: errorErrMsg,
      },
    });

    return {
      success: false,
      refundId: newRefund.id,
      status: 'failed',
      alreadyProcessed: false,
      message: 'Falha ao processar estorno no Mercado Pago; mantido em fila para reconciliação.',
      error: errorErrMsg,
    };
  }
}

/**
 * Reconcilia um refund individual consultando o status do pagamento no Mercado Pago.
 */
export async function reconcileSingleRefund(
  refundId: string,
  dbClient?: unknown,
): Promise<{ success: boolean; status: string; error?: string }> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data: refund, error: rfError } = await adminDb
    .from('payment_refunds')
    .select('*')
    .eq('id', refundId)
    .maybeSingle();

  if (rfError || !refund) {
    return { success: false, status: 'unknown', error: 'Refund não encontrado.' };
  }

  if (refund.status === 'confirmed') {
    return { success: true, status: 'confirmed' };
  }

  // Importa fetchAuthoritativePayment dinamicamente para evitar ciclo
  const { fetchAuthoritativePayment } = await import('./webhook-service');
  try {
    const payment = await fetchAuthoritativePayment(refund.provider_payment_id);

    if (payment.status === 'refunded' || payment.statusDetail === 'refunded') {
      const nowIso = new Date().toISOString();

      await adminDb
        .from('payment_refunds')
        .update({
          status: 'confirmed',
          confirmed_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', refund.id);

      await adminDb
        .from('payment_transactions')
        .update({
          status: 'refunded',
          refund_status: 'refunded',
          refund_amount: refund.amount_cents / 100,
          refunded_at: nowIso,
          mp_refund_id: refund.provider_refund_id,
          updated_at: nowIso,
        })
        .eq('id', refund.transaction_id);

      await adminDb
        .from('customer_plate_consultations')
        .update({
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: nowIso,
        })
        .eq('id', refund.consultation_id);

      await adminDb.from('consultation_audit_logs').insert({
        consultation_id: refund.consultation_id,
        transaction_id: refund.transaction_id,
        actor_type: 'system',
        event: 'refund_confirmed',
        details: {
          refund_id: refund.id,
          provider_payment_id: refund.provider_payment_id,
          amount_cents: refund.amount_cents,
        },
      });

      return { success: true, status: 'confirmed' };
    }

    return { success: true, status: refund.status };
  } catch (err: any) {
    return { success: false, status: refund.status, error: err?.message };
  }
}

/**
 * Reconcilia todos os refunds com status 'requested' ou 'pending'
 */
export async function reconcileAllPendingRefunds(
  dbClient?: unknown,
): Promise<{ checkedCount: number; confirmedCount: number; stillPendingCount: number }> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data: pendingRefunds, error } = await adminDb
    .from('payment_refunds')
    .select('id')
    .in('status', ['requested', 'pending', 'failed'])
    .order('created_at', { ascending: true })
    .limit(20);

  if (error || !pendingRefunds || pendingRefunds.length === 0) {
    return { checkedCount: 0, confirmedCount: 0, stillPendingCount: 0 };
  }

  let confirmedCount = 0;
  let stillPendingCount = 0;

  for (const rf of pendingRefunds) {
    const res = await reconcileSingleRefund(rf.id, adminDb);
    if (res.status === 'confirmed') {
      confirmedCount++;
    } else {
      stillPendingCount++;
    }
  }

  return {
    checkedCount: pendingRefunds.length,
    confirmedCount,
    stillPendingCount,
  };
}

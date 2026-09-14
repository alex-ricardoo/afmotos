import { createAdminClient } from '../supabase/admin.ts';
import { getMercadoPagoConfig } from './client.ts';
import { PaymentRefund } from 'mercadopago';
import { logCheckoutProEvent, maskId } from './observability.ts';
import { serializeMercadoPagoError } from './error-serializer.ts';

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
  safeProviderError?: ReturnType<typeof serializeMercadoPagoError>;
}

export const PERMANENT_REFUND_REASONS = [
  'APIBRASIL_INSUFFICIENT_CREDITS',
  'APIBRASIL_AUTH_ERROR',
  'APIBRASIL_CONFIGURATION_ERROR',
  'APIBRASIL_RETRIES_EXHAUSTED',
  'APIBRASIL_PROVIDER_UNAVAILABLE_PERMANENT',
  'MOCK_MODE_IN_PRODUCTION',
] as const;

export interface RefundEligibilityParams {
  transaction: {
    id: string;
    payment_status?: string;
    status?: string;
    mp_payment_id?: string | null;
    amount?: number;
    transaction_amount?: number;
    payment_method_id?: string;
    user_id?: string;
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
  reasonCode?: string;
}

export interface RefundEligibilityResult {
  eligible: boolean;
  reason: string | null;
  supportActionRequired?: 'RECHARGE_APIBRASIL' | null;
}

/**
 * Valida de forma pura e estrita se uma transação e consulta são elegíveis para estorno total.
 */
export function evaluateRefundEligibility({
  transaction,
  consultation,
  existingRefund,
  reasonCode,
}: RefundEligibilityParams): RefundEligibilityResult {
  const currentStatus = transaction.payment_status || transaction.status;
  if (currentStatus !== 'approved') {
    return {
      eligible: false,
      reason: `Pagamento não está aprovado (status: ${currentStatus || 'desconhecido'}).`,
    };
  }

  if (transaction.payment_method_id !== 'credit' && !transaction.mp_payment_id) {
    return {
      eligible: false,
      reason: 'Identificador oficial do Mercado Pago (mp_payment_id) ausente na transação.',
    };
  }

  const amount = Number(transaction.transaction_amount ?? transaction.amount ?? 0);
  if (amount <= 0) {
    return {
      eligible: false,
      reason: 'Valor da transação inválido para estorno.',
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

  const supportActionRequired =
    reasonCode === 'APIBRASIL_INSUFFICIENT_CREDITS' ? 'RECHARGE_APIBRASIL' : null;

  return {
    eligible: true,
    reason: null,
    supportActionRequired,
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
    .replace(/[a-f0-9]{32,64}/gi, (match) => (match.length >= 32 ? '[REDACTED_HASH]' : match));
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

  console.log(
    `[PAYMENT_REFUND] payment_refund.eligibility_checked transactionId=${maskId(transactionId)} consultationId=${maskId(consultationId)} reason=${reasonCode}`,
  );

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

  // 3. Verifica se já existe ordem de refund ativa ou confirmada
  const { data: existingRefund } = await adminDb
    .from('payment_refunds')
    .select('*')
    .eq('transaction_id', transaction.id)
    .in('status', ['requested', 'pending', 'confirmed'])
    .maybeSingle();

  // 4. Avalia elegibilidade estrita
  const eligibility = evaluateRefundEligibility({
    transaction,
    consultation,
    existingRefund,
    reasonCode,
  });

  if (!eligibility.eligible) {
    if (existingRefund) {
      console.log(
        `[PAYMENT_REFUND] payment_refund.duplicate_prevented transactionId=${maskId(transaction.id)} refundId=${existingRefund.id} status=${existingRefund.status}`,
      );
      return {
        success: true,
        refundId: existingRefund.id,
        providerRefundId: existingRefund.provider_refund_id || undefined,
        status: existingRefund.status,
        alreadyProcessed: true,
        message: 'Estorno já registrado ou em andamento.',
      };
    }

    return {
      success: false,
      refundId: '',
      status: 'failed',
      alreadyProcessed: false,
      message: eligibility.reason || 'Transação não elegível para estorno.',
      error: eligibility.reason || undefined,
    };
  }

  // Se a falha for por créditos da API Brasil, registra alerta interno no log
  if (eligibility.supportActionRequired === 'RECHARGE_APIBRASIL') {
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transaction.id,
      actor_type: 'system',
      event: 'support_attention_required',
      details: {
        alert: 'Ação necessária: recarregar saldo da API Brasil.',
        support_action_required: 'RECHARGE_APIBRASIL',
        reason_code: reasonCode,
      },
    });
  }

  // 4b. Intercepta estorno de crédito interno
  if (transaction.payment_method_id === 'credit') {
    const { releaseConsultationCredit } = await import('../credits/credit-service.ts');
    // Em payment_transactions o campo user_id armazena o dono
    const released = await releaseConsultationCredit(transaction.user_id, consultationId, adminDb);
    
    if (released) {
      const nowIso = new Date().toISOString();
      await adminDb
        .from('payment_transactions')
        .update({
          status: 'refunded',
          refund_status: 'refunded',
          refund_amount: Number(transaction.transaction_amount),
          refunded_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', transaction.id);

      await adminDb
        .from('customer_plate_consultations')
        .update({
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: nowIso,
        })
        .eq('id', consultation.id);
        
      await adminDb.from('consultation_audit_logs').insert({
        consultation_id: consultation.id,
        transaction_id: transaction.id,
        actor_type: 'system',
        event: 'credit_refund_confirmed',
        details: { reason_code: reasonCode }
      });

      return {
        success: true,
        refundId: 'credit-refund-' + transaction.id,
        status: 'confirmed',
        alreadyProcessed: false,
        message: 'Crédito estornado com sucesso.',
      };
    } else {
      return {
        success: false,
        refundId: '',
        status: 'failed',
        alreadyProcessed: false,
        message: 'Falha ao estornar crédito via RPC.',
      };
    }
  }

  const amountCents = Math.round(Number(transaction.transaction_amount) * 100);
  const mpPaymentId = String(transaction.mp_payment_id).trim();
  const idempotencyKey = buildRefundIdempotencyKey(transaction.id, mpPaymentId);

  // 5. Cria o registro de refund com status 'requested' (Atômico)
  const { data: newRefund, error: createError } = await adminDb
    .from('payment_refunds')
    .insert({
      transaction_id: transaction.id,
      consultation_id: consultation.id,
      provider: 'mercadopago',
      provider_payment_id: mpPaymentId,
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
        message: 'Estorno já existente criado por processo concorrente.',
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

  console.log(
    `[PAYMENT_REFUND] payment_refund.provider_request_sent transactionId=${maskId(transaction.id)} mpPaymentId=${maskId(mpPaymentId)} amountCents=${amountCents}`,
  );

  // 6. Chamada Autoritativa à API do Mercado Pago com idempotencyKey
  let providerRefundId: string | null = null;
  try {
    const mpConfig = getMercadoPagoConfig();
    const refundClient = new PaymentRefund(mpConfig);

    const mpRefundResponse = await refundClient.total({
      payment_id: mpPaymentId,
      requestOptions: {
        idempotencyKey,
      },
    });

    if (mpRefundResponse && mpRefundResponse.id) {
      providerRefundId = String(mpRefundResponse.id);
    }

    const isConfirmed =
      mpRefundResponse?.status === 'approved' || mpRefundResponse?.status === 'refunded';

    const finalStatus = isConfirmed ? 'confirmed' : 'pending';
    const nowIso = new Date().toISOString();

    await adminDb
      .from('payment_refunds')
      .update({
        status: finalStatus,
        provider_refund_id: providerRefundId,
        confirmed_at: isConfirmed ? nowIso : null,
        updated_at: nowIso,
      })
      .eq('id', newRefund.id);

    if (isConfirmed) {
      await adminDb
        .from('payment_transactions')
        .update({
          status: 'refunded',
          refund_status: 'refunded',
          refund_amount: amountCents / 100,
          refunded_at: nowIso,
          mp_refund_id: providerRefundId,
          updated_at: nowIso,
        })
        .eq('id', transaction.id);

      await adminDb
        .from('customer_plate_consultations')
        .update({
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: nowIso,
        })
        .eq('id', consultation.id);

      console.log(
        `[PAYMENT_REFUND] payment_refund.confirmed transactionId=${maskId(transaction.id)} refundId=${newRefund.id} mpRefundId=${maskId(providerRefundId)}`,
      );
    } else {
      console.log(
        `[PAYMENT_REFUND] payment_refund.pending transactionId=${maskId(transaction.id)} refundId=${newRefund.id} providerStatus=${mpRefundResponse?.status || 'pending'}`,
      );
    }

    // Auditoria
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transaction.id,
      actor_type: 'system',
      event: isConfirmed ? 'refund_confirmed' : 'refund_requested',
      details: {
        refund_id: newRefund.id,
        provider_refund_id: providerRefundId,
        mp_payment_id: mpPaymentId,
        amount_cents: amountCents,
        reason_code: reasonCode,
        duration_ms: Date.now() - startTime,
      },
    });

    return {
      success: true,
      refundId: newRefund.id,
      providerRefundId: providerRefundId || undefined,
      status: finalStatus,
      alreadyProcessed: false,
      message: isConfirmed
        ? 'Estorno integral confirmado com sucesso pelo Mercado Pago.'
        : 'Solicitação de estorno enviada ao Mercado Pago (processamento pendente).',
    };
  } catch (mpErr: unknown) {
    const safeError = serializeMercadoPagoError(mpErr);

    console.error(
      `[PAYMENT_REFUND] payment_refund.failed transactionId=${maskId(transaction.id)} mpPaymentId=${maskId(mpPaymentId)} httpStatus=${safeError.httpStatus} apiCode=${safeError.apiCode} causeCode=${safeError.causeCode} retryable=${safeError.retryable}: ${safeError.errorMessage}`,
    );

    const targetStatus = safeError.retryable ? 'pending' : 'failed';
    const nowIso = new Date().toISOString();

    await adminDb
      .from('payment_refunds')
      .update({
        status: targetStatus,
        last_error_code: safeError.apiCode || safeError.causeCode || 'MP_REFUND_API_ERROR',
        last_error_safe:
          safeError.errorMessage || 'Instabilidade técnica na comunicação com o Mercado Pago.',
        failed_at: nowIso,
        updated_at: nowIso,
      })
      .eq('id', newRefund.id);

    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transaction.id,
      actor_type: 'system',
      event: 'refund_failed',
      details: {
        refund_id: newRefund.id,
        mp_payment_id: mpPaymentId,
        reason_code: reasonCode,
        http_status: safeError.httpStatus,
        api_code: safeError.apiCode,
        cause_code: safeError.causeCode,
        cause_message: safeError.causeMessage,
        error: safeError.errorMessage,
        retryable: safeError.retryable,
      },
    });

    return {
      success: false,
      refundId: newRefund.id,
      status: targetStatus,
      alreadyProcessed: false,
      message: 'Falha ao processar estorno no Mercado Pago; registrado para reconciliação.',
      error: safeError.errorMessage || 'Erro de comunicação com o gateway',
      safeProviderError: safeError,
    };
  }
}

/**
 * Reconcilia um refund individual consultando o pagamento e a lista de refunds do Mercado Pago.
 */
export async function reconcileSingleRefund(
  refundId: string,
  dbClient?: unknown,
): Promise<{ success: boolean; status: string; mpRefundId?: string; error?: string }> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data: refund, error: rfError } = await adminDb
    .from('payment_refunds')
    .select('*')
    .eq('id', refundId)
    .maybeSingle();

  if (rfError || !refund) {
    return { success: false, status: 'unknown', error: 'Registro de refund não encontrado.' };
  }

  if (refund.status === 'confirmed') {
    return {
      success: true,
      status: 'confirmed',
      mpRefundId: refund.provider_refund_id || undefined,
    };
  }

  const { fetchAuthoritativePayment } = await import('./webhook-service.ts');

  try {
    const payment = await fetchAuthoritativePayment(refund.provider_payment_id);

    // Consulta também a lista autoritativa de refunds vinculados a este payment_id
    let remoteRefundId: string | null = refund.provider_refund_id;
    let isConfirmed = payment.status === 'refunded' || payment.statusDetail === 'refunded';

    try {
      const mpConfig = getMercadoPagoConfig();
      const refundClient = new PaymentRefund(mpConfig);
      const refundList = await refundClient.list({
        payment_id: refund.provider_payment_id,
      });

      if (Array.isArray(refundList) && refundList.length > 0) {
        const approvedRefund = refundList.find(
          (r) => r.status === 'approved' || r.status === 'refunded',
        );
        if (approvedRefund) {
          isConfirmed = true;
          if (approvedRefund.id) {
            remoteRefundId = String(approvedRefund.id);
          }
        }
      }
    } catch (listErr) {
      console.warn('[reconcileSingleRefund] Falha ao consultar refundClient.list:', listErr);
    }

    const nowIso = new Date().toISOString();

    if (isConfirmed) {
      await adminDb
        .from('payment_refunds')
        .update({
          status: 'confirmed',
          provider_refund_id: remoteRefundId,
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
          mp_refund_id: remoteRefundId,
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
          provider_refund_id: remoteRefundId,
          amount_cents: refund.amount_cents,
        },
      });

      console.log(
        `[PAYMENT_REFUND] payment_refund.confirmed (via reconciliation) transactionId=${maskId(refund.transaction_id)} refundId=${refund.id} mpRefundId=${maskId(remoteRefundId)}`,
      );

      return { success: true, status: 'confirmed', mpRefundId: remoteRefundId || undefined };
    }

    return {
      success: true,
      status: refund.status,
      mpRefundId: refund.provider_refund_id || undefined,
    };
  } catch (err: unknown) {
    const safeError = serializeMercadoPagoError(err);
    console.warn(
      `[reconcileSingleRefund] Erro ao consultar Mercado Pago: ${safeError.errorMessage}`,
    );
    return {
      success: false,
      status: refund.status,
      error: safeError.errorMessage || 'Erro de rede',
    };
  }
}

/**
 * Reconcilia o refund de uma transação diretamente pelo transactionId.
 */
export async function reconcileRefundByTransactionId(
  transactionId: string,
  dbClient?: unknown,
): Promise<{ success: boolean; status: string; mpRefundId?: string; error?: string }> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data: refund } = await adminDb
    .from('payment_refunds')
    .select('id')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!refund) {
    return { success: false, status: 'none', error: 'Nenhum estorno associado à transação.' };
  }

  return reconcileSingleRefund(refund.id, adminDb);
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

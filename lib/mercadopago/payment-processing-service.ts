import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { executeVehiclePlateLookup } from '@/lib/vehicle-lookup/service';
import { getMercadoPagoWebhookUrl } from './client';
import { getPaymentProvider } from './payment-provider-factory';
import { resolveActiveProviderAdapter } from './payment-provider';
import { createMercadoPagoPaymentRequestSnapshot } from './request-snapshot';
import { type ProcessPaymentRouteInput } from './schemas';
import {
  paymentLogInfo,
  paymentLogWarn,
  paymentLogError,
  extractSafeError,
} from '@/lib/observability/payment-logger';

export interface ProcessPaymentServiceResult {
  success: boolean;
  pending?: boolean;
  retryable?: boolean;
  transactionId?: string;
  paymentId?: string;
  status: string;
  statusDetail?: string;
  consultationStatus?: string;
  message?: string;
  error?: string;
}

// In-memory cache for recent token hashes (10 min TTL) to enforce single-use tokens
const recentTokenHashes = new Map<string, number>();

function verifyTokenHashUniqueness(token: string): {
  valid: boolean;
  tokenHashTruncated: string;
  reason?: string;
} {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex').substring(0, 12);
  const now = Date.now();

  for (const [hash, timestamp] of recentTokenHashes.entries()) {
    if (now - timestamp > 10 * 60 * 1000) {
      recentTokenHashes.delete(hash);
    }
  }

  if (recentTokenHashes.has(tokenHash)) {
    return {
      valid: false,
      tokenHashTruncated: tokenHash,
      reason: 'Token já utilizado em tentativa anterior. Um novo token é obrigatório.',
    };
  }

  recentTokenHashes.set(tokenHash, now);
  return { valid: true, tokenHashTruncated: tokenHash };
}

/**
 * Core business service for processing credit card payments via Route Handler.
 * Enforces ownership, server-side canonical price, idempotency, snapshot logging,
 * provider adapter execution and safe consultation release.
 */
export async function processCardPaymentService(params: {
  userId: string;
  userEmail: string;
  input: ProcessPaymentRouteInput;
  flowId?: string;
}): Promise<ProcessPaymentServiceResult> {
  const { userId, userEmail, input, flowId = crypto.randomUUID() } = params;
  const activeAdapter = resolveActiveProviderAdapter();

  paymentLogInfo('payment.route_processing_started', {
    flowId,
    consultationId: input.consultationId,
    paymentMethodId: input.paymentMethodId,
    tokenLength: input.token.length,
    issuerPresent: Boolean(input.issuerId),
    installments: input.installments,
    providerAdapter: activeAdapter,
  });

  // 1. Enforce token single-use
  const tokenCheck = verifyTokenHashUniqueness(input.token);
  if (!tokenCheck.valid) {
    paymentLogWarn('payment.token_reuse_blocked', {
      flowId,
      consultationId: input.consultationId,
      tokenHashTruncated: tokenCheck.tokenHashTruncated,
    });
    return {
      success: false,
      retryable: true,
      status: 'rejected',
      message: tokenCheck.reason || 'Token inválido ou expirado. Por favor, tente novamente.',
    };
  }

  const supabase = createAdminClient();

  // 2. Fetch consultation and verify ownership
  const { data: consultation, error: consultationErr } = await supabase
    .from('customer_plate_consultations')
    .select('id, user_id, plate, status, payment_status')
    .eq('id', input.consultationId)
    .single();

  if (consultationErr || !consultation) {
    paymentLogWarn('payment.consultation_not_found', {
      flowId,
      consultationId: input.consultationId,
    });
    return {
      success: false,
      status: 'not_found',
      message: 'Consulta veicular não encontrada.',
    };
  }

  if (consultation.user_id !== userId) {
    paymentLogWarn('payment.consultation_ownership_mismatch', {
      flowId,
      consultationId: input.consultationId,
      userId,
    });
    return {
      success: false,
      status: 'forbidden',
      message: 'Acesso não autorizado para esta consulta.',
    };
  }

  if (consultation.status === 'completed' || consultation.payment_status === 'paid') {
    paymentLogInfo('payment.consultation_already_completed', {
      flowId,
      consultationId: input.consultationId,
    });
    return {
      success: true,
      status: 'approved',
      consultationStatus: 'completed',
      message: 'Esta consulta já foi paga e liberada.',
    };
  }

  // 3. Fetch server canonical price
  const canonicalPrice = await getVehicleConsultationPrice();
  if (canonicalPrice <= 0) {
    paymentLogError('payment.invalid_canonical_price', {
      flowId,
      canonicalPrice,
    });
    return {
      success: false,
      status: 'system_error',
      message: 'Valor da consulta indisponível no momento.',
    };
  }

  // 4. Create pending transaction in Supabase
  const idempotencyKey = crypto.randomUUID();
  const { data: transactionRecord, error: txCreateErr } = await supabase
    .from('payment_transactions')
    .insert({
      consultation_id: input.consultationId,
      user_id: userId,
      provider: 'mercadopago',
      amount: canonicalPrice,
      currency: 'BRL',
      payment_method: 'credit_card',
      payment_method_id: input.paymentMethodId,
      installments: input.installments,
      status: 'pending',
      idempotency_key: idempotencyKey,
      issuer_id: input.issuerId,
      metadata: {
        flow_id: flowId,
        provider_adapter: activeAdapter,
        client_observability: input.clientObservability,
      },
    })
    .select('id')
    .single();

  if (txCreateErr || !transactionRecord) {
    paymentLogError('payment.transaction_creation_failed', {
      flowId,
      consultationId: input.consultationId,
      error: txCreateErr?.message,
    });
    return {
      success: false,
      retryable: true,
      status: 'provider_error',
      message: 'Falha ao iniciar sessão de transação. Tente novamente.',
    };
  }

  const transactionId = transactionRecord.id;

  // 5. Emit sanitized pre-execution snapshot
  const notificationUrl = getMercadoPagoWebhookUrl() || undefined;
  const description = `Consulta Veicular AF Motos - Placa ${consultation.plate || ''}`.trim();

  const bodyForSnapshot = {
    transaction_amount: canonicalPrice,
    token: input.token,
    description,
    installments: input.installments,
    payment_method_id: input.paymentMethodId,
    issuer_id: input.issuerId,
    payer: {
      email: userEmail,
      identification: {
        type: 'CPF',
        number: input.payer.identification.number,
      },
    },
    external_reference: input.consultationId,
    notification_url: notificationUrl,
    metadata: {
      consultation_id: input.consultationId,
      transaction_id: transactionId,
      flow_id: flowId,
      provider_adapter: activeAdapter,
    },
  };

  const snapshot = createMercadoPagoPaymentRequestSnapshot(bodyForSnapshot, {
    flowId,
    consultationId: input.consultationId,
    tokenCreatedAt: input.clientObservability?.tokenCreatedAt,
    submitAttemptNumber: input.clientObservability?.submitAttemptNumber || 1,
    paymentTypeId: 'credit_card',
    issuerProvidedByBrick: Boolean(input.issuerId),
    issuerSource: input.issuerId ? 'brick' : 'omitted',
    providerAdapter: activeAdapter,
    route: '/api/mp/process-payment',
  });

  paymentLogInfo('payment.request_snapshot_logged', {
    snapshotId: snapshot.snapshotId,
    flowId,
    transactionId,
    providerAdapter: activeAdapter,
    sdkVersion: snapshot.sdkVersion,
    tokenHashTruncated: snapshot.request.token.hashTruncated,
    issuerOrigin: snapshot.request.issuer.origin,
  });

  // 6. Invoke active Mercado Pago provider adapter
  const startTime = Date.now();
  let providerResult;
  try {
    const provider = getPaymentProvider(activeAdapter);
    providerResult = await provider.createCardPayment({
      transactionAmount: canonicalPrice,
      token: input.token,
      description,
      installments: input.installments,
      paymentMethodId: input.paymentMethodId,
      issuerId: input.issuerId,
      payerEmail: userEmail,
      payerCpf: input.payer.identification.number,
      externalReference: input.consultationId,
      notificationUrl,
      idempotencyKey,
      metadata: {
        consultation_id: input.consultationId,
        transaction_id: transactionId,
        flow_id: flowId,
      },
    });
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const safeErr = extractSafeError(err);

    paymentLogError('payment.provider_call_threw', {
      flowId,
      transactionId,
      durationMs,
      errorName: safeErr.errorName,
      errorMessage: safeErr.errorMessageSanitized,
      providerAdapter: activeAdapter,
    });

    // On exception, update transaction to provider_error
    await supabase
      .from('payment_transactions')
      .update({
        status: 'provider_error',
        error_message: 'Falha técnica na comunicação com o Mercado Pago.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    return {
      success: false,
      retryable: true,
      transactionId,
      status: 'provider_error',
      message:
        'Não foi possível processar o pagamento com a operadora no momento. Nenhuma cobrança foi confirmada. Por favor, tente novamente em instantes.',
    };
  }

  const durationMs = Date.now() - startTime;

  paymentLogInfo('payment.provider_response_received', {
    flowId,
    transactionId,
    durationMs,
    success: providerResult.success,
    status: providerResult.status,
    statusDetail: providerResult.statusDetail,
    paymentIdPresent: Boolean(providerResult.paymentId),
    providerAdapter: activeAdapter,
  });

  // 7. Handle Approved status
  if (providerResult.status === 'approved' && providerResult.paymentId) {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'approved',
        status_detail: providerResult.statusDetail || 'accredited',
        mp_payment_id: providerResult.paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    await supabase
      .from('customer_plate_consultations')
      .update({
        payment_status: 'paid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.consultationId);

    // Trigger plate lookup asynchronously/synchronously
    try {
      await executeVehiclePlateLookup(
        {
          plate: consultation.plate,
          userId: consultation.user_id,
          confirmedPlate: consultation.plate,
        },
        supabase,
      );
    } catch (lookupErr: unknown) {
      paymentLogError('payment.lookup_execution_failed', {
        flowId,
        consultationId: input.consultationId,
        error: extractSafeError(lookupErr).errorMessageSanitized,
      });
    }

    return {
      success: true,
      transactionId,
      paymentId: providerResult.paymentId,
      status: 'approved',
      statusDetail: providerResult.statusDetail || 'accredited',
      consultationStatus: 'completed',
    };
  }

  // 8. Handle Pending status
  if (providerResult.status === 'pending' || providerResult.status === 'in_process') {
    await supabase
      .from('payment_transactions')
      .update({
        status: providerResult.status,
        status_detail: providerResult.statusDetail,
        mp_payment_id: providerResult.paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    return {
      success: false,
      pending: true,
      transactionId,
      paymentId: providerResult.paymentId,
      status: providerResult.status,
      message:
        'Seu pagamento está em processamento pela operadora do cartão. Assim que for confirmado, o laudo será liberado automaticamente.',
    };
  }

  // 9. Handle Rejected status
  if (providerResult.status === 'rejected') {
    await supabase
      .from('payment_transactions')
      .update({
        status: 'rejected',
        status_detail: providerResult.statusDetail,
        mp_payment_id: providerResult.paymentId,
        error_message: 'Pagamento recusado pela emissora do cartão.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    return {
      success: false,
      retryable: true,
      transactionId,
      status: 'rejected',
      statusDetail: providerResult.statusDetail,
      message:
        'Pagamento não aprovado pela emissora do cartão. Verifique os dados do cartão, limite disponível ou tente outro meio de pagamento.',
    };
  }

  // 10. Handle Provider Error / HTTP 500 / other unexpected
  await supabase
    .from('payment_transactions')
    .update({
      status: 'provider_error',
      status_detail: providerResult.statusDetail,
      error_message: providerResult.error?.message || 'Erro interno do Mercado Pago',
      updated_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  return {
    success: false,
    retryable: true,
    transactionId,
    status: 'provider_error',
    message:
      'Não foi possível processar o pagamento com a operadora no momento. Nenhuma cobrança foi confirmada. Por favor, tente novamente em instantes.',
  };
}

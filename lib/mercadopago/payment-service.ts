import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import {
  findExistingConsultation,
  executeVehiclePlateLookup,
} from '@/lib/vehicle-lookup/service';
import {
  getPaymentClient,
  getRefundClient,
  getMercadoPagoPublicKey,
  getMercadoPagoWebhookSecret,
  isDevPaymentSimulationEnabled,
} from './client';
import { verifyMercadoPagoWebhookSignature } from './signature';
import {
  type PaymentTransaction,
  type MercadoPagoPaymentStatus,
  type RefundStatus,
  type ProcessBrickPaymentResult,
  type BrickSubmitFormData,
  type PaymentPreferenceData,
} from './types';
import {
  createPaymentPreferenceSchema,
  brickPaymentSubmitSchema,
} from './schemas';

/**
 * -------------------------------------------------------------
 * Audit & Transaction Persistence Helpers (Supabase Admin Client)
 * -------------------------------------------------------------
 */

export async function recordAuditLog(params: {
  consultationId: string;
  event:
    | 'payment_created'
    | 'payment_approved'
    | 'payment_rejected'
    | 'lookup_started'
    | 'lookup_completed'
    | 'lookup_failed'
    | 'refund_initiated'
    | 'refund_completed'
    | 'refund_failed'
    | 'admin_reconciliation';
  actorType: 'customer' | 'system' | 'admin' | 'webhook';
  actorId?: string | null;
  transactionId?: string | null;
  details?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('consultation_audit_logs').insert({
      consultation_id: params.consultationId,
      event: params.event,
      actor_type: params.actorType,
      actor_id: params.actorId || null,
      transaction_id: params.transactionId || null,
      details: params.details || {},
    });
  } catch (err) {
    console.error('[recordAuditLog] Failed to record audit log:', err);
  }
}

export async function recordPaymentTransaction(data: {
  consultationId: string;
  userId: string;
  mpPaymentId?: string | null;
  status: MercadoPagoPaymentStatus;
  statusDetail?: string | null;
  paymentMethodId?: string | null;
  paymentTypeId?: string | null;
  transactionAmount: number;
  netReceivedAmount?: number | null;
  installments?: number;
  payerEmail?: string | null;
  payerIdentificationType?: string | null;
  payerIdentificationNumber?: string | null;
  rawResponse?: Record<string, unknown> | null;
}): Promise<PaymentTransaction | null> {
  const admin = createAdminClient();
  const { data: transaction, error } = await admin
    .from('payment_transactions')
    .insert({
      consultation_id: data.consultationId,
      user_id: data.userId,
      mp_payment_id: data.mpPaymentId || null,
      status: data.status,
      status_detail: data.statusDetail || null,
      payment_method_id: data.paymentMethodId || null,
      payment_type_id: data.paymentTypeId || null,
      transaction_amount: data.transactionAmount,
      net_received_amount: data.netReceivedAmount || null,
      installments: data.installments || 1,
      payer_email: data.payerEmail || null,
      payer_identification_type: data.payerIdentificationType || null,
      payer_identification_number: data.payerIdentificationNumber || null,
      refund_status: 'none',
      raw_response: data.rawResponse || null,
    })
    .select('*')
    .single();

  if (error || !transaction) {
    console.error('[recordPaymentTransaction] Database error:', error);
    return null;
  }

  // Link latest transaction to customer_plate_consultations
  await admin
    .from('customer_plate_consultations')
    .update({
      latest_payment_transaction_id: transaction.id,
      payment_method: data.paymentMethodId || 'mercadopago',
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.consultationId);

  return transaction as PaymentTransaction;
}

export async function updatePaymentTransaction(
  id: string,
  updates: Partial<PaymentTransaction>
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('payment_transactions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
}

/**
 * -------------------------------------------------------------
 * Preference Initialization (Client Setup)
 * -------------------------------------------------------------
 */

export async function createPaymentPreference(
  consultationId: string
): Promise<{ success: boolean; data?: PaymentPreferenceData; error?: string }> {
  const parse = createPaymentPreferenceSchema.safeParse({ consultationId });
  if (!parse.success) {
    return { success: false, error: 'ID de consulta inválido' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  const { data: consultation, error } = await supabase
    .from('customer_plate_consultations')
    .select('id, plate, status, payment_status')
    .eq('id', consultationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error || !consultation) {
    return { success: false, error: 'Consulta não encontrada.' };
  }

  const publicKey = getMercadoPagoPublicKey();
  if (!publicKey) {
    return {
      success: false,
      error: 'Mercado Pago Public Key não configurada.',
    };
  }

  // Canonical price authoritative from database
  const canonicalPrice = await getVehicleConsultationPrice();

  return {
    success: true,
    data: {
      consultationId: consultation.id,
      plate: consultation.plate,
      amount: canonicalPrice,
      publicKey,
      payerEmail: user.email || '',
      payerName: user.user_metadata?.full_name || '',
    },
  };
}

/**
 * -------------------------------------------------------------
 * Automatic Refund Processor (US3)
 * -------------------------------------------------------------
 */

export async function processAutoRefund(params: {
  consultationId: string;
  transactionId?: string;
  mpPaymentId: string;
  reason: string;
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const admin = createAdminClient();

  await recordAuditLog({
    consultationId: params.consultationId,
    transactionId: params.transactionId,
    event: 'refund_initiated',
    actorType: 'system',
    details: { reason: params.reason, mpPaymentId: params.mpPaymentId },
  });

  try {
    const refundClient = getRefundClient();
    const mpPaymentIdNumber = Number(params.mpPaymentId);

    if (isNaN(mpPaymentIdNumber)) {
      throw new Error(`ID de pagamento MP inválido para estorno: ${params.mpPaymentId}`);
    }

    const refundResponse = await refundClient.create({
      payment_id: mpPaymentIdNumber,
      body: {},
    });

    const refundId = String(refundResponse.id);
    const nowIso = new Date().toISOString();

    if (params.transactionId) {
      await updatePaymentTransaction(params.transactionId, {
        refund_status: 'refunded',
        refund_amount: refundResponse.amount,
        refunded_at: nowIso,
        refund_reason: params.reason,
        mp_refund_id: refundId,
      });
    }

    await admin
      .from('customer_plate_consultations')
      .update({
        payment_status: 'refunded',
        auto_refund_attempted: true,
        lookup_error_message: params.reason,
        updated_at: nowIso,
      })
      .eq('id', params.consultationId);

    await recordAuditLog({
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      event: 'refund_completed',
      actorType: 'system',
      details: { refundId, amount: refundResponse.amount },
    });

    return { success: true, refundId };
  } catch (err: any) {
    console.error('[processAutoRefund] Error issuing refund with Mercado Pago:', err);
    const errorMsg = err?.message || 'Falha ao comunicar com Mercado Pago';

    if (params.transactionId) {
      await updatePaymentTransaction(params.transactionId, {
        refund_status: 'failed',
        refund_reason: `${params.reason} (Erro ao estornar: ${errorMsg})`,
      });
    }

    await admin
      .from('customer_plate_consultations')
      .update({
        auto_refund_attempted: true,
        lookup_error_message: `${params.reason} (Atenção: estorno automático falhou, acione o suporte)`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.consultationId);

    await recordAuditLog({
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      event: 'refund_failed',
      actorType: 'system',
      details: { error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * -------------------------------------------------------------
 * Brick Payment Processing (US1 & US4)
 * -------------------------------------------------------------
 */

export async function processBrickPayment(
  consultationId: string,
  formData: BrickSubmitFormData
): Promise<ProcessBrickPaymentResult> {
  const parse = brickPaymentSubmitSchema.safeParse({ consultationId, formData });
  if (!parse.success) {
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: parse.error.issues[0]?.message || 'Dados de pagamento inválidos',
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: 'Usuário não autenticado.',
    };
  }

  // Fetch consultation
  const { data: consultation, error: fetchError } = await supabase
    .from('customer_plate_consultations')
    .select('*')
    .eq('id', consultationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError || !consultation) {
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: 'Consulta veicular não encontrada.',
    };
  }

  // If already completed, return directly
  if (consultation.status === 'completed' && consultation.vehicle_data) {
    return {
      success: true,
      status: 'approved',
      consultationId,
    };
  }

  // Enforce server-authoritative price
  const canonicalPrice = await getVehicleConsultationPrice();

  try {
    const paymentClient = getPaymentClient();
    const mpPayment = await paymentClient.create({
      body: {
        transaction_amount: canonicalPrice,
        token: formData.token,
        description: `Consulta Veicular Placa ${consultation.plate}`,
        payment_method_id: formData.payment_method_id,
        installments: formData.installments || 1,
        issuer_id: formData.issuer_id ? Number(formData.issuer_id) : undefined,
        payer: {
          email: user.email || formData.payer.email,
          identification: formData.payer.identification,
        },
        external_reference: consultation.id,
        metadata: {
          consultation_id: consultation.id,
          user_id: user.id,
          plate: consultation.plate,
        },
      },
    });

    const mpPaymentId = String(mpPayment.id);
    const mpStatus = (mpPayment.status || 'pending') as MercadoPagoPaymentStatus;
    const statusDetail = mpPayment.status_detail;

    // Record transaction row
    const transaction = await recordPaymentTransaction({
      consultationId: consultation.id,
      userId: user.id,
      mpPaymentId,
      status: mpStatus,
      statusDetail,
      paymentMethodId: formData.payment_method_id,
      paymentTypeId: mpPayment.payment_type_id,
      transactionAmount: canonicalPrice,
      netReceivedAmount: mpPayment.transaction_details?.net_received_amount,
      installments: formData.installments || 1,
      payerEmail: user.email || formData.payer.email,
      payerIdentificationType: formData.payer.identification?.type,
      payerIdentificationNumber: formData.payer.identification?.number,
      rawResponse: mpPayment as unknown as Record<string, unknown>,
    });

    await recordAuditLog({
      consultationId: consultation.id,
      transactionId: transaction?.id,
      event: mpStatus === 'approved' ? 'payment_approved' : 'payment_created',
      actorType: 'customer',
      actorId: user.id,
      details: { mpPaymentId, status: mpStatus, statusDetail },
    });

    // Pix or Async response extraction
    const pointOfInteraction = mpPayment.point_of_interaction;
    const qrCode = pointOfInteraction?.transaction_data?.qr_code;
    const qrCodeBase64 = pointOfInteraction?.transaction_data?.qr_code_base64;
    const ticketUrl = pointOfInteraction?.transaction_data?.ticket_url;

    // If Payment Approved Immediately: Trigger Consultation Lookup
    if (mpStatus === 'approved') {
      const lookupResult = await executePostPaymentLookup({
        consultation,
        transactionId: transaction?.id,
        mpPaymentId,
      });

      if (!lookupResult.success) {
        return {
          success: false,
          status: 'lookup_failed_refunded',
          statusDetail: 'lookup_failed_refunded',
          consultationId,
          error: lookupResult.error,
        };
      }

      return {
        success: true,
        status: 'approved',
        statusDetail,
        paymentId: mpPaymentId,
        consultationId,
      };
    }

    // Pending status (e.g. Pix)
    return {
      success: true,
      status: mpStatus,
      statusDetail,
      paymentId: mpPaymentId,
      consultationId,
      qrCode,
      qrCodeBase64,
      ticketUrl,
    };
  } catch (err: any) {
    console.error('[processBrickPayment] Exception calling Mercado Pago:', err);
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: err?.message || 'Falha na comunicação com o Mercado Pago',
    };
  }
}

/**
 * -------------------------------------------------------------
 * Vehicle Lookup Execution & Auto-Refund Safeguard (US1, US2, US3)
 * -------------------------------------------------------------
 */

export async function executePostPaymentLookup(params: {
  consultation: {
    id: string;
    plate: string;
    plate_normalized: string;
    user_id: string;
  };
  transactionId?: string;
  mpPaymentId: string;
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  await recordAuditLog({
    consultationId: params.consultation.id,
    transactionId: params.transactionId,
    event: 'lookup_started',
    actorType: 'system',
  });

  // Mark as processing
  await admin
    .from('customer_plate_consultations')
    .update({
      payment_status: 'paid',
      payment_date: nowIso,
      status: 'processing',
      updated_at: nowIso,
    })
    .eq('id', params.consultation.id);

  try {
    // 1. Check cache first
    const cached = await findExistingConsultation(
      params.consultation.plate_normalized,
      admin
    );

    if (cached && cached.status === 'COMPLETED' && cached.raw_response) {
      await admin
        .from('customer_plate_consultations')
        .update({
          status: 'completed',
          vehicle_data: cached.raw_response,
          updated_at: nowIso,
        })
        .eq('id', params.consultation.id);

      await recordAuditLog({
        consultationId: params.consultation.id,
        transactionId: params.transactionId,
        event: 'lookup_completed',
        actorType: 'system',
        details: { source: 'cache' },
      });

      return { success: true };
    }

    // 2. Execute live/mock plate lookup
    const lookupResult = await executeVehiclePlateLookup(
      {
        plate: params.consultation.plate_normalized,
        userId: params.consultation.user_id,
        confirmedPlate: params.consultation.plate_normalized,
      },
      admin
    );

    if (lookupResult.success && lookupResult.record && lookupResult.record.raw_response) {
      await admin
        .from('customer_plate_consultations')
        .update({
          status: 'completed',
          vehicle_data: lookupResult.record.raw_response,
          updated_at: nowIso,
        })
        .eq('id', params.consultation.id);

      await recordAuditLog({
        consultationId: params.consultation.id,
        transactionId: params.transactionId,
        event: 'lookup_completed',
        actorType: 'system',
        details: { source: 'provider' },
      });

      return { success: true };
    }

    // Permanent lookup failure: Trigger Auto-Refund
    throw new Error(
      lookupResult.message || 'Falha técnica ao obter dados do veículo junto ao Detran/Bases Oficiais'
    );
  } catch (err: any) {
    const errorMsg = err?.message || 'Serviço de consulta veicular indisponível no momento';
    console.error('[executePostPaymentLookup] Lookup failed:', errorMsg);

    await recordAuditLog({
      consultationId: params.consultation.id,
      transactionId: params.transactionId,
      event: 'lookup_failed',
      actorType: 'system',
      details: { error: errorMsg },
    });

    // AUTO-REFUND TRIGGER
    await processAutoRefund({
      consultationId: params.consultation.id,
      transactionId: params.transactionId,
      mpPaymentId: params.mpPaymentId,
      reason: errorMsg,
    });

    return { success: false, error: errorMsg };
  }
}

/**
 * -------------------------------------------------------------
 * Webhook Processor (US2)
 * -------------------------------------------------------------
 */

export interface WebhookHandlerParams {
  xSignature: string | null;
  xRequestId: string | null;
  dataId?: string | null;
  type?: string | null;
  action?: string | null;
  payload: Record<string, unknown>;
  headers?: Record<string, unknown>;
}

export async function handleMercadoPagoWebhook(
  params: WebhookHandlerParams
): Promise<{ status: number; message: string }> {
  const admin = createAdminClient();
  const secret = getMercadoPagoWebhookSecret();

  const resourceId = params.dataId || (params.payload.data as any)?.id;
  const eventId = String(params.payload.id || params.xRequestId || resourceId || Date.now());
  const eventType = String(params.payload.type || params.type || params.payload.action || 'unknown');
  const action = String(params.payload.action || params.action || '');

  // 1. Validate signature if secret is configured
  let signatureValid = true;
  if (secret) {
    signatureValid = verifyMercadoPagoWebhookSignature({
      xSignature: params.xSignature,
      xRequestId: params.xRequestId,
      dataId: String(resourceId || ''),
      secret,
    });
  }

  // 2. Record incoming webhook in audit table
  const { data: eventRecord, error: insertError } = await admin
    .from('webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      action,
      mp_resource_id: resourceId ? String(resourceId) : null,
      signature_valid: signatureValid,
      processing_status: 'pending',
      payload: params.payload,
      headers: params.headers || null,
    })
    .select('id, processing_status')
    .single();

  if (insertError) {
    // Check if unique constraint violated (already received this event)
    if (insertError.code === '23505') {
      return { status: 200, message: 'Event already recorded' };
    }
    console.error('[handleMercadoPagoWebhook] Error recording webhook:', insertError);
  }

  if (secret && !signatureValid) {
    if (eventRecord?.id) {
      await admin
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          processing_error: 'Assinatura HMAC inválida',
        })
        .eq('id', eventRecord.id);
    }
    return { status: 401, message: 'Assinatura HMAC inválida' };
  }

  // If not a payment event, ignore gracefully
  if (eventType !== 'payment' && !action.startsWith('payment.')) {
    if (eventRecord?.id) {
      await admin
        .from('webhook_events')
        .update({ processing_status: 'ignored' })
        .eq('id', eventRecord.id);
    }
    return { status: 200, message: 'Ignored non-payment event' };
  }

  if (!resourceId) {
    return { status: 200, message: 'No resource ID provided' };
  }

  // 3. Fetch canonical payment data from Mercado Pago API
  try {
    const paymentClient = getPaymentClient();
    const mpPayment = await paymentClient.get({ id: Number(resourceId) });

    const mpPaymentId = String(mpPayment.id);
    const mpStatus = (mpPayment.status || 'pending') as MercadoPagoPaymentStatus;
    const consultationId = mpPayment.external_reference;

    if (!consultationId) {
      if (eventRecord?.id) {
        await admin
          .from('webhook_events')
          .update({
            processing_status: 'ignored',
            processing_error: 'external_reference missing',
          })
          .eq('id', eventRecord.id);
      }
      return { status: 200, message: 'No external_reference found on payment' };
    }

    // 4. Find consultation
    const { data: consultation } = await admin
      .from('customer_plate_consultations')
      .select('*')
      .eq('id', consultationId)
      .maybeSingle();

    if (!consultation) {
      if (eventRecord?.id) {
        await admin
          .from('webhook_events')
          .update({
            processing_status: 'failed',
            processing_error: `Consulta ${consultationId} não encontrada`,
          })
          .eq('id', eventRecord.id);
      }
      return { status: 200, message: 'Consultation not found in database' };
    }

    // 5. Update or create transaction record
    const { data: existingTx } = await admin
      .from('payment_transactions')
      .select('*')
      .eq('mp_payment_id', mpPaymentId)
      .maybeSingle();

    let transactionId = existingTx?.id;

    if (existingTx) {
      await updatePaymentTransaction(existingTx.id, {
        status: mpStatus,
        status_detail: mpPayment.status_detail,
        raw_response: mpPayment as unknown as Record<string, unknown>,
      });
    } else {
      const createdTx = await recordPaymentTransaction({
        consultationId: consultation.id,
        userId: consultation.user_id,
        mpPaymentId,
        status: mpStatus,
        statusDetail: mpPayment.status_detail,
        paymentMethodId: mpPayment.payment_method_id,
        paymentTypeId: mpPayment.payment_type_id,
        transactionAmount: Number(mpPayment.transaction_amount || 0),
        netReceivedAmount: mpPayment.transaction_details?.net_received_amount,
        installments: mpPayment.installments || 1,
        payerEmail: mpPayment.payer?.email,
        payerIdentificationType: mpPayment.payer?.identification?.type,
        payerIdentificationNumber: mpPayment.payer?.identification?.number,
        rawResponse: mpPayment as unknown as Record<string, unknown>,
      });
      transactionId = createdTx?.id;
    }

    await recordAuditLog({
      consultationId: consultation.id,
      transactionId,
      event: mpStatus === 'approved' ? 'payment_approved' : 'payment_created',
      actorType: 'webhook',
      details: { mpPaymentId, status: mpStatus, statusDetail: mpPayment.status_detail },
    });

    // 6. If payment approved, execute post-payment lookup
    if (mpStatus === 'approved') {
      if (consultation.status !== 'completed') {
        await executePostPaymentLookup({
          consultation,
          transactionId,
          mpPaymentId,
        });
      }
    }

    // 7. Mark webhook as processed
    if (eventRecord?.id) {
      await admin
        .from('webhook_events')
        .update({
          processing_status: 'processed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', eventRecord.id);
    }

    return { status: 200, message: 'Processed successfully' };
  } catch (err: any) {
    console.error('[handleMercadoPagoWebhook] Error processing payment webhook:', err);
    if (eventRecord?.id) {
      await admin
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          processing_error: err?.message || 'Erro inesperado',
        })
        .eq('id', eventRecord.id);
    }
    return { status: 500, message: 'Internal Server Error' };
  }
}


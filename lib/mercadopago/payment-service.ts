import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { findExistingConsultation, executeVehiclePlateLookup } from '@/lib/vehicle-lookup/service';
import { getVehicleLookupConfig } from '@/lib/vehicle-lookup/config';
import {
  getPaymentClient,
  getRefundClient,
  getMercadoPagoPublicKey,
  getMercadoPagoWebhookSecret,
} from './client';
import { verifyMercadoPagoWebhookSignature } from './signature';
import {
  type PaymentTransaction,
  type MercadoPagoPaymentStatus,
  type ProcessBrickPaymentResult,
  type BrickSubmitFormData,
  type PaymentPreferenceData,
} from './types';
import {
  createPaymentPreferenceSchema,
  brickPaymentSubmitSchema,
  cardPaymentFormDataSchema,
  pixPaymentFormDataSchema,
  ticketPaymentFormDataSchema,
  normalizeCpf,
} from './schemas';
import {
  paymentLogInfo,
  paymentLogWarn,
  paymentLogError,
  maskEmail,
  extractSafeError,
} from '@/lib/observability/payment-logger';

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
  flowId?: string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('consultation_audit_logs').insert({
      consultation_id: params.consultationId,
      event: params.event,
      actor_type: params.actorType,
      actor_id: params.actorId || null,
      transaction_id: params.transactionId || null,
      details: {
        ...(params.details || {}),
        flowId: params.flowId || (params.details as Record<string, unknown> | undefined)?.flowId,
      },
    });
  } catch (err) {
    console.error('[recordAuditLog] Failed to record audit log:', err);
  }
}

export async function recordPaymentTransaction(data: {
  consultationId: string;
  userId: string;
  idempotencyKey?: string | null;
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
  failureCode?: string | null;
  failureMessageSafe?: string | null;
  rawResponse?: Record<string, unknown> | null;
  flowId?: string;
}): Promise<PaymentTransaction | null> {
  const admin = createAdminClient();
  const startTime = Date.now();

  paymentLogInfo('payment.db_transaction_create_started', {
    flowId: data.flowId,
    consultationId: data.consultationId,
    mercadoPagoPaymentId: data.mpPaymentId || undefined,
    table: 'payment_transactions',
    operation: 'insert',
    amount: data.transactionAmount,
    currency: 'BRL',
    paymentMethodId: data.paymentMethodId || undefined,
  });

  const { data: transaction, error } = await admin
    .from('payment_transactions')
    .insert({
      consultation_id: data.consultationId,
      user_id: data.userId,
      idempotency_key: data.idempotencyKey || crypto.randomUUID(),
      mp_payment_id: data.mpPaymentId || null,
      status: data.status,
      status_detail: data.statusDetail || null,
      payment_method_id: data.paymentMethodId || null,
      payment_type_id: data.paymentTypeId || null,
      transaction_amount: data.transactionAmount,
      net_received_amount: data.netReceivedAmount || null,
      installments: data.installments || 1,
      payer_email: data.payerEmail || null,
      payer_identification_type: data.payerIdentificationType || 'CPF',
      payer_identification_number: data.payerIdentificationNumber || null,
      failure_code: data.failureCode || null,
      failure_message_safe: data.failureMessageSafe || null,
      refund_status: 'none',
      raw_response: data.rawResponse
        ? { ...data.rawResponse, _flowId: data.flowId }
        : data.flowId
          ? { _flowId: data.flowId }
          : null,
    })
    .select('*')
    .single();

  if (error || !transaction) {
    paymentLogError('payment.db_transaction_create_failed', {
      flowId: data.flowId,
      consultationId: data.consultationId,
      errorCode: error?.code,
      errorMessage: error?.message,
      table: 'payment_transactions',
      operation: 'insert',
      durationMs: Date.now() - startTime,
    });
    console.error('[recordPaymentTransaction] Database error:', error);
    return null;
  }

  paymentLogInfo('payment.db_transaction_create_succeeded', {
    flowId: data.flowId,
    consultationId: data.consultationId,
    transactionId: transaction.id,
    mercadoPagoPaymentId: data.mpPaymentId || undefined,
    table: 'payment_transactions',
    operation: 'insert',
    durationMs: Date.now() - startTime,
  });

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
  updates: Partial<PaymentTransaction>,
  flowId?: string,
): Promise<void> {
  const admin = createAdminClient();
  const startTime = Date.now();

  paymentLogInfo('payment.db_transaction_update_started', {
    flowId,
    transactionId: id,
    statusAfter: updates.status,
    table: 'payment_transactions',
    operation: 'update',
  });

  const { error } = await admin
    .from('payment_transactions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    paymentLogError('payment.db_transaction_update_failed', {
      flowId,
      transactionId: id,
      errorCode: error.code,
      errorMessage: error.message,
      table: 'payment_transactions',
      operation: 'update',
      durationMs: Date.now() - startTime,
    });
  } else {
    paymentLogInfo('payment.db_transaction_update_succeeded', {
      flowId,
      transactionId: id,
      statusAfter: updates.status,
      table: 'payment_transactions',
      operation: 'update',
      durationMs: Date.now() - startTime,
    });
  }
}

/**
 * -------------------------------------------------------------
 * Preference Initialization (Client Setup)
 * -------------------------------------------------------------
 */

export async function createPaymentPreference(
  consultationId: string,
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
  flowId?: string;
}): Promise<{ success: boolean; refundId?: string; error?: string }> {
  const admin = createAdminClient();
  const startTime = Date.now();

  paymentLogInfo('refund.eligibility_check_started', {
    flowId: params.flowId,
    consultationId: params.consultationId,
    transactionId: params.transactionId,
    mercadoPagoPaymentId: params.mpPaymentId,
    reason: params.reason,
  });

  const mpPaymentIdNumber = Number(params.mpPaymentId);
  if (isNaN(mpPaymentIdNumber)) {
    paymentLogWarn('refund.not_eligible', {
      flowId: params.flowId,
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      mercadoPagoPaymentId: params.mpPaymentId,
      errorMessage: 'Invalid mpPaymentId',
    });
    return {
      success: false,
      error: `ID de pagamento MP inválido para estorno: ${params.mpPaymentId}`,
    };
  }

  paymentLogInfo('refund.eligibility_check_succeeded', {
    flowId: params.flowId,
    consultationId: params.consultationId,
    transactionId: params.transactionId,
    mercadoPagoPaymentId: params.mpPaymentId,
  });

  await recordAuditLog({
    consultationId: params.consultationId,
    transactionId: params.transactionId,
    event: 'refund_initiated',
    actorType: 'system',
    details: { reason: params.reason, mpPaymentId: params.mpPaymentId, flowId: params.flowId },
    flowId: params.flowId,
  });

  paymentLogInfo('refund.request_started', {
    flowId: params.flowId,
    consultationId: params.consultationId,
    transactionId: params.transactionId,
    mercadoPagoPaymentId: params.mpPaymentId,
  });

  try {
    const refundClient = getRefundClient();
    const refundResponse = await refundClient.create({
      payment_id: mpPaymentIdNumber,
      body: {},
    });

    const refundId = String(refundResponse.id);
    const nowIso = new Date().toISOString();

    paymentLogInfo('refund.request_succeeded', {
      flowId: params.flowId,
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      mercadoPagoPaymentId: params.mpPaymentId,
      mercadoPagoRefundId: refundId,
      amount: refundResponse.amount,
      durationMs: Date.now() - startTime,
    });

    paymentLogInfo('refund.status_persist_started', {
      flowId: params.flowId,
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      mercadoPagoRefundId: refundId,
    });

    if (params.transactionId) {
      await updatePaymentTransaction(
        params.transactionId,
        {
          refund_status: 'refunded',
          refund_amount: refundResponse.amount,
          refunded_at: nowIso,
          refund_reason: params.reason,
          mp_refund_id: refundId,
        },
        params.flowId,
      );
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

    paymentLogInfo('refund.status_persist_succeeded', {
      flowId: params.flowId,
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      mercadoPagoRefundId: refundId,
    });

    await recordAuditLog({
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      event: 'refund_completed',
      actorType: 'system',
      details: { refundId, amount: refundResponse.amount, flowId: params.flowId },
      flowId: params.flowId,
    });

    return { success: true, refundId };
  } catch (err: unknown) {
    const safeErr = extractSafeError(err);
    paymentLogError('refund.request_failed', {
      flowId: params.flowId,
      consultationId: params.consultationId,
      transactionId: params.transactionId,
      mercadoPagoPaymentId: params.mpPaymentId,
      ...safeErr,
      durationMs: Date.now() - startTime,
    });

    console.error('[processAutoRefund] Error issuing refund with Mercado Pago:', err);
    const errorMsg = safeErr.providerMessage || 'Falha ao comunicar com Mercado Pago';

    if (params.transactionId) {
      await updatePaymentTransaction(
        params.transactionId,
        {
          refund_status: 'failed',
          refund_reason: `${params.reason} (Erro ao estornar: ${errorMsg})`,
        },
        params.flowId,
      );
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
      details: { error: errorMsg, flowId: params.flowId },
      flowId: params.flowId,
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
  formData: BrickSubmitFormData,
  flowIdParam?: string,
): Promise<ProcessBrickPaymentResult> {
  const flowId = flowIdParam || crypto.randomUUID();

  paymentLogInfo('payment.action_validation_started', {
    flowId,
    consultationId,
    paymentMethodId: formData?.payment_method_id,
  });

  const parse = brickPaymentSubmitSchema.safeParse({ consultationId, formData });
  if (!parse.success) {
    paymentLogWarn('payment.action_validation_failed', {
      flowId,
      consultationId,
      errorMessage: parse.error.issues[0]?.message || 'Dados de pagamento inválidos',
    });
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: parse.error.issues[0]?.message || 'Dados de pagamento inválidos',
    };
  }
  paymentLogInfo('payment.action_validation_succeeded', { flowId, consultationId });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    paymentLogWarn('payment.action_auth_missing', { flowId, consultationId });
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: 'Usuário não autenticado.',
    };
  }

  paymentLogInfo('payment.action_auth_resolved', {
    flowId,
    consultationId,
    userId: user.id,
    userEmailMasked: maskEmail(user.email),
  });

  // Fetch consultation
  paymentLogInfo('payment.action_consultation_lookup_started', {
    flowId,
    consultationId,
    userId: user.id,
  });

  const { data: consultation, error: fetchError } = await supabase
    .from('customer_plate_consultations')
    .select('*')
    .eq('id', consultationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError || !consultation) {
    paymentLogWarn('payment.action_consultation_not_found', {
      flowId,
      consultationId,
      userId: user.id,
      errorCode: fetchError?.code,
      errorMessage: fetchError?.message,
    });
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: 'Consulta veicular não encontrada.',
    };
  }

  paymentLogInfo('payment.action_consultation_loaded', {
    flowId,
    consultationId,
    userId: user.id,
    plate: consultation.plate,
    statusBefore: consultation.status,
  });

  // If already completed, return directly
  if (consultation.status === 'completed' && consultation.vehicle_data) {
    paymentLogInfo('payment.action_transaction_reused', {
      flowId,
      consultationId,
      status: 'approved',
      reason: 'consultation_already_completed',
    });
    return {
      success: true,
      status: 'approved',
      consultationId,
    };
  }

  // Enforce server-authoritative price
  const canonicalPrice = await getVehicleConsultationPrice();

  // Extract address: from form submission or user profile
  let payerAddress = formData.payer.address;
  if (!payerAddress) {
    const { data: profile } = await supabase
      .from('customer_profiles')
      .select(
        'address_street, address_number, address_complement, address_neighborhood, address_city, address_state, address_zip, full_name',
      )
      .eq('id', user.id)
      .maybeSingle();

    if (
      profile?.address_zip &&
      profile.address_street &&
      profile.address_city &&
      profile.address_state
    ) {
      payerAddress = {
        zip_code: profile.address_zip.replace(/\D/g, ''),
        street_name: profile.address_street,
        street_number: profile.address_number || 'S/N',
        neighborhood: profile.address_neighborhood || 'Centro',
        city: profile.address_city,
        federal_unit: profile.address_state.toUpperCase(),
        complement: profile.address_complement || undefined,
      };
    }
  }

  const isTicket =
    formData.payment_method_id.toLowerCase().includes('bol') ||
    formData.payment_method_id.toLowerCase().includes('ticket') ||
    formData.payment_method_id.toLowerCase() === 'pec';
  const isPix = formData.payment_method_id.toLowerCase() === 'pix';
  const isCard = Boolean(formData.token) || (!isTicket && !isPix);

  // Method-specific discriminated schema validations
  let validatedCardData;
  if (isCard) {
    const cardParse = cardPaymentFormDataSchema.safeParse(formData);
    if (!cardParse.success) {
      const errorMsg =
        cardParse.error.issues[0]?.message || 'Dados do cartão incompletos ou inválidos';
      paymentLogWarn('payment.action_validation_failed', {
        flowId,
        consultationId,
        paymentMethodId: formData.payment_method_id,
        errorMessage: errorMsg,
      });
      return {
        success: false,
        status: 'rejected',
        consultationId,
        error: errorMsg,
      };
    }
    validatedCardData = cardParse.data;
  }

  let validatedTicketData;
  if (isTicket) {
    const ticketParse = ticketPaymentFormDataSchema.safeParse({
      ...formData,
      payer: {
        ...formData.payer,
        address: payerAddress,
      },
    });
    if (!ticketParse.success) {
      const errorMsg =
        ticketParse.error.issues[0]?.message ||
        'Para emissão de boleto bancário, o endereço completo (CEP, rua, número, bairro, cidade e UF) e CPF são obrigatórios.';
      paymentLogWarn('payment.action_validation_failed', {
        flowId,
        consultationId,
        paymentMethodId: formData.payment_method_id,
        errorMessage: errorMsg,
      });
      return {
        success: false,
        status: 'rejected',
        consultationId,
        error: errorMsg,
      };
    }
    validatedTicketData = ticketParse.data;
  }

  let validatedPixData;
  if (isPix) {
    const pixParse = pixPaymentFormDataSchema.safeParse(formData);
    if (!pixParse.success) {
      const errorMsg = pixParse.error.issues[0]?.message || 'Dados do Pix inválidos';
      paymentLogWarn('payment.action_validation_failed', {
        flowId,
        consultationId,
        paymentMethodId: formData.payment_method_id,
        errorMessage: errorMsg,
      });
      return {
        success: false,
        status: 'rejected',
        consultationId,
        error: errorMsg,
      };
    }
    validatedPixData = pixParse.data;
  }

  // Server-authoritative normalized CPF
  const rawDocNumber =
    validatedCardData?.payer.identification?.number ||
    validatedTicketData?.payer.identification?.number ||
    validatedPixData?.payer.identification?.number ||
    formData.payer?.identification?.number ||
    '';
  const normalizedCpf = normalizeCpf(rawDocNumber);

  if (isCard && normalizedCpf.length !== 11) {
    paymentLogWarn('payment.action_validation_failed', {
      flowId,
      consultationId,
      paymentMethodId: formData.payment_method_id,
      errorMessage: 'CPF com quantidade inválida de dígitos',
    });
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: 'Informe um CPF válido para continuar.',
    };
  }

  const addressCompleteness = {
    zipCode: Boolean(payerAddress?.zip_code),
    streetName: Boolean(payerAddress?.street_name),
    streetNumber: Boolean(payerAddress?.street_number),
    neighborhood: Boolean(payerAddress?.neighborhood),
    city: Boolean(payerAddress?.city),
    federalUnit: Boolean(payerAddress?.federal_unit),
  };

  paymentLogInfo('payment.provider_client_initialization_started', { flowId, consultationId });
  let paymentClient;
  try {
    paymentClient = getPaymentClient();
    paymentLogInfo('payment.provider_client_initialization_succeeded', { flowId, consultationId });
  } catch (clientErr) {
    const safeErr = extractSafeError(clientErr);
    paymentLogError('payment.provider_client_configuration_missing', {
      flowId,
      consultationId,
      ...safeErr,
    });
    return {
      success: false,
      status: 'rejected',
      consultationId,
      error: 'Configuração de pagamento indisponível no momento.',
    };
  }

  // Idempotency Key & Prior Transaction Persistence
  const admin = createAdminClient();

  // Reuse existing idempotency key if a pending transaction already exists for this consultation
  const { data: existingPendingTx } = await admin
    .from('payment_transactions')
    .select('*')
    .eq('consultation_id', consultation.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let localTransaction: PaymentTransaction | null = null;
  let idempotencyKey: string;

  if (existingPendingTx && existingPendingTx.idempotency_key) {
    localTransaction = existingPendingTx as PaymentTransaction;
    idempotencyKey = existingPendingTx.idempotency_key;
    paymentLogInfo('payment.idempotency_key_reused', {
      flowId,
      consultationId: consultation.id,
      transactionId: localTransaction.id,
      idempotencyKeyPresent: true,
    });
  } else {
    idempotencyKey = crypto.randomUUID();
    localTransaction = await recordPaymentTransaction({
      consultationId: consultation.id,
      userId: user.id,
      idempotencyKey,
      status: 'pending',
      paymentMethodId: formData.payment_method_id,
      paymentTypeId: isCard ? 'credit_card' : isTicket ? 'ticket' : isPix ? 'bank_transfer' : null,
      transactionAmount: canonicalPrice,
      installments: formData.installments || 1,
      payerEmail: user.email || formData.payer.email,
      payerIdentificationType: 'CPF',
      payerIdentificationNumber: normalizedCpf || null,
      flowId,
    });
  }

  paymentLogInfo('payment.provider_request_build_started', { flowId, consultationId });

  paymentLogInfo('payment.provider_request_build_succeeded', {
    flowId,
    consultationId,
    transactionAmount: canonicalPrice,
    currency: 'BRL',
    hasToken: Boolean(formData.token),
    paymentMethodId: formData.payment_method_id,
    paymentTypeId: isCard
      ? 'credit_card'
      : isTicket
        ? 'ticket'
        : isPix
          ? 'bank_transfer'
          : undefined,
    installments: formData.installments || 1,
    issuerProvided: Boolean(formData.issuer_id),
    payerEmailPresent: Boolean(user.email || formData.payer?.email),
    payerIdentificationTypePresent: Boolean(normalizedCpf),
    payerIdentificationType: 'CPF',
    payerIdentificationLength: normalizedCpf.length,
    hasAddress: Boolean(payerAddress),
    addressFieldsPresent: addressCompleteness,
    externalReferencePresent: Boolean(consultation.id),
    idempotencyKeyPresent: Boolean(idempotencyKey),
  });

  const fullName = (user.user_metadata?.full_name || '').trim();
  const [defaultFirst, ...defaultRest] = fullName.split(' ');
  const payerFirstName = formData.payer.first_name || defaultFirst || 'Cliente';
  const payerLastName = formData.payer.last_name || defaultRest.join(' ') || 'AF Motos';

  const parsedIssuer = formData.issuer_id ? Number(formData.issuer_id) : undefined;
  const validIssuerId = parsedIssuer && !isNaN(parsedIssuer) ? parsedIssuer : undefined;

  const payerPayload: Record<string, unknown> = {
    email: user.email || formData.payer.email,
    first_name: payerFirstName,
    last_name: payerLastName,
    identification: {
      type: 'CPF',
      number: normalizedCpf,
    },
  };

  if (isTicket && payerAddress) {
    payerPayload.address = {
      zip_code: payerAddress.zip_code.replace(/\D/g, ''),
      street_name: payerAddress.street_name,
      street_number: String(payerAddress.street_number || 'S/N'),
      neighborhood: payerAddress.neighborhood,
      city: payerAddress.city,
      federal_unit: payerAddress.federal_unit.toUpperCase(),
    };
  }

  const paymentBody: Record<string, unknown> = {
    transaction_amount: canonicalPrice,
    description: `Consulta Veicular Placa ${consultation.plate}`,
    payment_method_id: formData.payment_method_id,
    payer: payerPayload,
    external_reference: consultation.id,
    metadata: {
      consultation_id: consultation.id,
      user_id: user.id,
      plate: consultation.plate,
      flow_id: flowId,
      transaction_id: localTransaction?.id,
    },
  };

  if (isCard) {
    paymentBody.token = formData.token;
    paymentBody.installments = formData.installments || 1;
    if (validIssuerId) {
      paymentBody.issuer_id = validIssuerId;
    }
  }

  const createStart = Date.now();
  paymentLogInfo('payment.provider_create_started', {
    flowId,
    consultationId,
    paymentMethodId: formData.payment_method_id,
    tokenPresent: Boolean(formData.token),
    canonicalAmount: canonicalPrice,
    currency: 'BRL',
    idempotencyKeyPresent: Boolean(idempotencyKey),
  });

  try {
    const mpPayment = await paymentClient.create({
      body: paymentBody as Parameters<typeof paymentClient.create>[0]['body'],
      requestOptions: {
        idempotencyKey,
      },
    });

    const createDurationMs = Date.now() - createStart;
    const mpPaymentId = String(mpPayment.id);
    const mpStatus = (mpPayment.status || 'pending') as MercadoPagoPaymentStatus;
    const statusDetail = mpPayment.status_detail;

    paymentLogInfo('payment.provider_create_succeeded', {
      flowId,
      consultationId,
      mercadoPagoPaymentId: mpPaymentId,
      providerStatus: mpStatus,
      providerStatusDetail: statusDetail,
      paymentTypeId: mpPayment.payment_type_id,
      durationMs: createDurationMs,
    });

    // Update local transaction with provider response
    if (localTransaction) {
      await updatePaymentTransaction(
        localTransaction.id,
        {
          mp_payment_id: mpPaymentId,
          status: mpStatus,
          status_detail: statusDetail,
          payment_method_id: formData.payment_method_id,
          payment_type_id: mpPayment.payment_type_id,
          net_received_amount: mpPayment.transaction_details?.net_received_amount,
          raw_response: mpPayment as unknown as Record<string, unknown>,
        },
        flowId,
      );
    }

    paymentLogInfo('payment.status_transition', {
      flowId,
      transactionId: localTransaction?.id,
      consultationId,
      statusBefore: 'pending',
      statusAfter: mpStatus,
      reason: 'mercado_pago_response',
    });

    await recordAuditLog({
      consultationId: consultation.id,
      transactionId: localTransaction?.id,
      event: mpStatus === 'approved' ? 'payment_approved' : 'payment_created',
      actorType: 'customer',
      actorId: user.id,
      details: { mpPaymentId, status: mpStatus, statusDetail },
      flowId,
    });

    // Pix or Async response extraction
    const pointOfInteraction = mpPayment.point_of_interaction;
    const qrCode = pointOfInteraction?.transaction_data?.qr_code;
    const qrCodeBase64 = pointOfInteraction?.transaction_data?.qr_code_base64;
    const ticketUrl =
      pointOfInteraction?.transaction_data?.ticket_url ||
      (mpPayment.transaction_details as { external_resource_url?: string } | undefined)
        ?.external_resource_url;

    // If Payment Approved Immediately: Trigger Consultation Lookup
    if (mpStatus === 'approved') {
      const lookupResult = await executePostPaymentLookup({
        consultation,
        transactionId: localTransaction?.id,
        mpPaymentId,
        flowId,
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
  } catch (err: unknown) {
    const createDurationMs = Date.now() - createStart;
    const normalizedError = extractSafeError(err);

    paymentLogError('payment.provider_create_failed', {
      flowId,
      consultationId,
      paymentMethodId: formData.payment_method_id,
      tokenPresent: Boolean(formData.token),
      canonicalAmount: canonicalPrice,
      providerStatus: normalizedError.providerStatus,
      providerMessage: normalizedError.providerMessage,
      providerError: normalizedError.providerError,
      causeCount: normalizedError.causeCount,
      causesSummary: normalizedError.causesSummary,
      durationMs: createDurationMs,
    });

    // Mark local transaction with safe failure status
    if (localTransaction) {
      await updatePaymentTransaction(
        localTransaction.id,
        {
          status: 'rejected',
          failure_code: 'MERCADO_PAGO_CREATE_FAILED',
          failure_message_safe: 'Não foi possível iniciar o pagamento.',
        },
        flowId,
      );
    }

    return {
      success: false,
      status: 'rejected',
      consultationId,
      error:
        'Não foi possível processar o pagamento agora. Revise os dados informados e tente novamente.',
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
  flowId?: string;
}): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const startTime = Date.now();
  const config = getVehicleLookupConfig();

  paymentLogInfo('lookup.orchestration_started', {
    flowId: params.flowId,
    consultationId: params.consultation.id,
    transactionId: params.transactionId,
    mercadoPagoPaymentId: params.mpPaymentId,
    plate: params.consultation.plate,
  });

  paymentLogInfo('lookup.mode_resolved', {
    flowId: params.flowId,
    consultationId: params.consultation.id,
    lookupMode: config.mode,
    lookupProvider: config.mode === 'mock' ? 'mock' : 'apibrasil',
  });

  await recordAuditLog({
    consultationId: params.consultation.id,
    transactionId: params.transactionId,
    event: 'lookup_started',
    actorType: 'system',
    flowId: params.flowId,
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
    const cached = await findExistingConsultation(params.consultation.plate_normalized, admin);

    if (cached && cached.status === 'COMPLETED' && cached.raw_response) {
      paymentLogInfo('lookup.mock_succeeded', {
        flowId: params.flowId,
        consultationId: params.consultation.id,
        transactionId: params.transactionId,
        source: 'cache',
        durationMs: Date.now() - startTime,
      });

      await admin
        .from('customer_plate_consultations')
        .update({
          status: 'completed',
          vehicle_data: cached.raw_response,
          updated_at: nowIso,
        })
        .eq('id', params.consultation.id);

      paymentLogInfo('lookup.consultation_marked_available', {
        flowId: params.flowId,
        consultationId: params.consultation.id,
        statusAfter: 'completed',
      });

      await recordAuditLog({
        consultationId: params.consultation.id,
        transactionId: params.transactionId,
        event: 'lookup_completed',
        actorType: 'system',
        details: { source: 'cache', flowId: params.flowId },
        flowId: params.flowId,
      });

      return { success: true };
    }

    // 2. Execute live/mock plate lookup
    if (config.mode === 'mock') {
      paymentLogInfo('lookup.mock_started', {
        flowId: params.flowId,
        consultationId: params.consultation.id,
        plate: params.consultation.plate,
      });
    } else {
      paymentLogInfo('lookup.live_started', {
        flowId: params.flowId,
        consultationId: params.consultation.id,
        plate: params.consultation.plate,
      });
    }

    const lookupResult = await executeVehiclePlateLookup(
      {
        plate: params.consultation.plate_normalized,
        userId: params.consultation.user_id,
        confirmedPlate: params.consultation.plate_normalized,
      },
      admin,
    );

    if (lookupResult.success && lookupResult.record && lookupResult.record.raw_response) {
      if (config.mode === 'mock') {
        paymentLogInfo('lookup.mock_succeeded', {
          flowId: params.flowId,
          consultationId: params.consultation.id,
          durationMs: Date.now() - startTime,
        });
      } else {
        paymentLogInfo('lookup.live_succeeded', {
          flowId: params.flowId,
          consultationId: params.consultation.id,
          durationMs: Date.now() - startTime,
        });
      }

      await admin
        .from('customer_plate_consultations')
        .update({
          status: 'completed',
          vehicle_data: lookupResult.record.raw_response,
          updated_at: nowIso,
        })
        .eq('id', params.consultation.id);

      paymentLogInfo('lookup.consultation_marked_available', {
        flowId: params.flowId,
        consultationId: params.consultation.id,
        statusAfter: 'completed',
      });

      await recordAuditLog({
        consultationId: params.consultation.id,
        transactionId: params.transactionId,
        event: 'lookup_completed',
        actorType: 'system',
        details: { source: 'provider', flowId: params.flowId },
        flowId: params.flowId,
      });

      return { success: true };
    }

    // Permanent lookup failure: Trigger Auto-Refund
    throw new Error(
      lookupResult.message ||
        'Falha técnica ao obter dados do veículo junto ao Detran/Bases Oficiais',
    );
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Serviço de consulta veicular indisponível no momento';
    const safeErr = extractSafeError(err);

    paymentLogError('lookup.consultation_marked_failed', {
      flowId: params.flowId,
      consultationId: params.consultation.id,
      transactionId: params.transactionId,
      ...safeErr,
      durationMs: Date.now() - startTime,
    });

    await recordAuditLog({
      consultationId: params.consultation.id,
      transactionId: params.transactionId,
      event: 'lookup_failed',
      actorType: 'system',
      details: { error: errorMsg, flowId: params.flowId },
      flowId: params.flowId,
    });

    // AUTO-REFUND TRIGGER
    await processAutoRefund({
      consultationId: params.consultation.id,
      transactionId: params.transactionId,
      mpPaymentId: params.mpPaymentId,
      reason: errorMsg,
      flowId: params.flowId,
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
  params: WebhookHandlerParams,
): Promise<{ status: number; message: string }> {
  const admin = createAdminClient();
  const secret = getMercadoPagoWebhookSecret();
  const startTime = Date.now();

  const payloadData = params.payload.data as Record<string, unknown> | undefined;
  const resourceId = params.dataId || payloadData?.id;
  const eventId = String(params.payload.id || params.xRequestId || resourceId || Date.now());
  const eventType = String(
    params.payload.type || params.type || params.payload.action || 'unknown',
  );
  const action = String(params.payload.action || params.action || '');
  const webhookFlowId = crypto.randomUUID();

  paymentLogInfo('webhook.request_received', {
    flowId: webhookFlowId,
    webhookEventId: eventId,
    eventType,
    action,
    hasResourceId: Boolean(resourceId),
    webhookSignaturePresent: Boolean(params.xSignature),
  });

  // 1. Validate signature if secret is configured
  let signatureValid = true;
  if (secret) {
    paymentLogInfo('webhook.signature_validation_started', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
    });

    signatureValid = verifyMercadoPagoWebhookSignature({
      xSignature: params.xSignature,
      xRequestId: params.xRequestId,
      dataId: String(resourceId || ''),
      secret,
    });

    if (signatureValid) {
      paymentLogInfo('webhook.signature_valid', {
        flowId: webhookFlowId,
        webhookEventId: eventId,
      });
    } else {
      paymentLogWarn('webhook.signature_invalid', {
        flowId: webhookFlowId,
        webhookEventId: eventId,
      });
    }
  } else {
    paymentLogWarn('webhook.signature_missing', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
      reason: 'secret_not_configured',
    });
  }

  // 2. Record incoming webhook in audit table
  paymentLogInfo('webhook.event_persist_started', {
    flowId: webhookFlowId,
    webhookEventId: eventId,
    eventType,
  });

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
    if (insertError.code === '23505') {
      paymentLogInfo('webhook.event_duplicate', {
        flowId: webhookFlowId,
        webhookEventId: eventId,
      });
      return { status: 200, message: 'Event already recorded' };
    }
    paymentLogError('webhook.event_persist_failed', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
      errorCode: insertError.code,
      errorMessage: insertError.message,
    });
  } else {
    paymentLogInfo('webhook.event_persist_succeeded', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
    });
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
    paymentLogInfo('webhook.lookup_orchestration_skipped', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
      reason: 'non_payment_event',
    });
    return { status: 200, message: 'Ignored non-payment event' };
  }

  if (!resourceId) {
    paymentLogWarn('webhook.payment_id_missing', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
    });
    return { status: 200, message: 'No resource ID provided' };
  }

  paymentLogInfo('webhook.payment_id_extracted', {
    flowId: webhookFlowId,
    webhookEventId: eventId,
    mercadoPagoPaymentId: String(resourceId),
  });

  // 3. Fetch canonical payment data from Mercado Pago API
  try {
    paymentLogInfo('webhook.provider_fetch_started', {
      flowId: webhookFlowId,
      mercadoPagoPaymentId: String(resourceId),
    });

    const paymentClient = getPaymentClient();
    const mpPayment = await paymentClient.get({ id: Number(resourceId) });

    paymentLogInfo('webhook.provider_fetch_succeeded', {
      flowId: webhookFlowId,
      mercadoPagoPaymentId: String(resourceId),
      providerStatus: mpPayment.status,
      providerStatusDetail: mpPayment.status_detail,
      amount: Number(mpPayment.transaction_amount || 0),
    });

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
    paymentLogInfo('webhook.transaction_lookup_started', {
      flowId: webhookFlowId,
      consultationId,
      mercadoPagoPaymentId: mpPaymentId,
    });

    const { data: consultation } = await admin
      .from('customer_plate_consultations')
      .select('*')
      .eq('id', consultationId)
      .maybeSingle();

    if (!consultation) {
      paymentLogWarn('webhook.transaction_not_found', {
        flowId: webhookFlowId,
        consultationId,
        mercadoPagoPaymentId: mpPaymentId,
      });

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
      paymentLogInfo('webhook.transaction_matched', {
        flowId: webhookFlowId,
        transactionId: existingTx.id,
        consultationId,
        mercadoPagoPaymentId: mpPaymentId,
      });

      paymentLogInfo('webhook.status_transition_started', {
        flowId: webhookFlowId,
        transactionId: existingTx.id,
        consultationId,
        statusBefore: existingTx.status,
        statusAfter: mpStatus,
      });

      await updatePaymentTransaction(
        existingTx.id,
        {
          status: mpStatus,
          status_detail: mpPayment.status_detail,
          raw_response: mpPayment as unknown as Record<string, unknown>,
        },
        webhookFlowId,
      );

      paymentLogInfo('webhook.status_transition_succeeded', {
        flowId: webhookFlowId,
        transactionId: existingTx.id,
        consultationId,
        statusAfter: mpStatus,
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
        flowId: webhookFlowId,
      });
      transactionId = createdTx?.id;
    }

    await recordAuditLog({
      consultationId: consultation.id,
      transactionId,
      event: mpStatus === 'approved' ? 'payment_approved' : 'payment_created',
      actorType: 'webhook',
      details: {
        mpPaymentId,
        status: mpStatus,
        statusDetail: mpPayment.status_detail,
        flowId: webhookFlowId,
      },
      flowId: webhookFlowId,
    });

    // 6. If payment approved, execute post-payment lookup
    if (mpStatus === 'approved') {
      if (consultation.status !== 'completed') {
        paymentLogInfo('webhook.lookup_orchestration_started', {
          flowId: webhookFlowId,
          consultationId,
          transactionId,
          mercadoPagoPaymentId: mpPaymentId,
        });

        await executePostPaymentLookup({
          consultation,
          transactionId,
          mpPaymentId,
          flowId: webhookFlowId,
        });
      } else {
        paymentLogInfo('webhook.lookup_orchestration_skipped', {
          flowId: webhookFlowId,
          consultationId,
          reason: 'consultation_already_completed',
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

    paymentLogInfo('webhook.completed', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
      consultationId,
      transactionId,
      mercadoPagoPaymentId: mpPaymentId,
      durationMs: Date.now() - startTime,
    });

    return { status: 200, message: 'Processed successfully' };
  } catch (err: unknown) {
    const safeErr = extractSafeError(err);
    paymentLogError('webhook.failed', {
      flowId: webhookFlowId,
      webhookEventId: eventId,
      ...safeErr,
      durationMs: Date.now() - startTime,
    });

    console.error('[handleMercadoPagoWebhook] Error processing payment webhook:', err);
    if (eventRecord?.id) {
      await admin
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          processing_error: safeErr.providerMessage || 'Erro inesperado',
        })
        .eq('id', eventRecord.id);
    }
    return { status: 500, message: 'Internal Server Error' };
  }
}

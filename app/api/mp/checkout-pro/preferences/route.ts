import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { buildPreferenceBody } from '@/lib/mercadopago/preference-builder';
import {
  getPreferenceClient,
  getCredentialMode,
  isTestMode,
  SDK_VERSION,
} from '@/lib/mercadopago/client';
import {
  logCheckoutProEvent,
  extractOriginAndPath,
  extractOrigin,
  truncateHash,
} from '@/lib/mercadopago/observability';
import {
  maskIdentifier,
  isValidMercadoPagoRedirectUrl,
} from '@/lib/mercadopago/security';
import {
  normalizeCheckoutProError,
  CheckoutProValidationError,
  CheckoutProDatabaseError,
} from '@/lib/mercadopago/error-normalizer';

const requestSchema = z.object({
  consultationId: z.string().uuid('ID de consulta inválido'),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const flowId = crypto.randomUUID();
  let currentConsultationId: string | undefined;
  let currentTransactionId: string | undefined;

  try {
    // 1. Início da autenticação de sessão
    logCheckoutProEvent('checkout_pro.preference_auth_started', { flowId });

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const normalized = normalizeCheckoutProError(
        new CheckoutProValidationError('Usuário não autenticado.', 401, 'UNAUTHORIZED'),
      );
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: 401,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: 0,
        },
        'warn',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: 401 },
      );
    }

    logCheckoutProEvent('checkout_pro.preference_auth_resolved', { flowId });

    // 2. Validação do Body da requisição
    let bodyJson: unknown;
    try {
      bodyJson = await request.json();
    } catch {
      const normalized = normalizeCheckoutProError(
        new CheckoutProValidationError('Corpo da requisição inválido.', 422, 'INVALID_BODY'),
      );
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: 422,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: 0,
        },
        'warn',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: 422 },
      );
    }

    const parseResult = requestSchema.safeParse(bodyJson);
    if (!parseResult.success) {
      const fieldError = parseResult.error.issues[0]?.message || 'Parâmetros inválidos.';
      const normalized = normalizeCheckoutProError(
        new CheckoutProValidationError(fieldError, 422, 'INVALID_INPUT'),
      );
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: 422,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: 0,
        },
        'warn',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: 422 },
      );
    }

    const { consultationId } = parseResult.data;
    currentConsultationId = consultationId;

    // 3. Início da verificação de titularidade da consulta
    logCheckoutProEvent('checkout_pro.preference_consultation_lookup_started', {
      flowId,
      consultationId,
    });

    const { data: consultation, error: fetchError } = await supabase
      .from('customer_plate_consultations')
      .select('id, user_id, plate, status, payment_status')
      .eq('id', consultationId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !consultation) {
      const normalized = normalizeCheckoutProError(
        new CheckoutProValidationError(
          'Consulta veicular não encontrada ou não pertence a você.',
          404,
          'NOT_FOUND',
        ),
      );
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          consultationId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: 404,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: 0,
        },
        'warn',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: 404 },
      );
    }

    // 4. Verificação de consulta já concluída ou paga
    if (consultation.status === 'completed' || consultation.payment_status === 'paid') {
      const normalized = normalizeCheckoutProError(
        new CheckoutProValidationError(
          'Esta consulta veicular já foi paga e concluída.',
          422,
          'CONSULTATION_ALREADY_PAID',
        ),
      );
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          consultationId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: 422,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: 0,
        },
        'warn',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: 422 },
      );
    }

    logCheckoutProEvent('checkout_pro.preference_consultation_loaded', {
      flowId,
      consultationId,
    });

    // 5. Consulta de preço canônico
    logCheckoutProEvent('checkout_pro.preference_price_lookup_started', {
      flowId,
      consultationId,
    });

    const canonicalPrice = await getVehicleConsultationPrice();
    if (typeof canonicalPrice !== 'number' || isNaN(canonicalPrice) || canonicalPrice <= 0) {
      const normalized = normalizeCheckoutProError(
        new CheckoutProValidationError('Valor canônico da consulta inválido.', 422, 'INVALID_PRICE'),
      );
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          consultationId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: 422,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: 0,
        },
        'error',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: 422 },
      );
    }

    logCheckoutProEvent('checkout_pro.preference_price_resolved', {
      flowId,
      consultationId,
      amount: { type: 'number', value: canonicalPrice },
      unitPrice: { type: 'number', value: canonicalPrice },
    });

    // 6. Criação de transação local para rastreamento e idempotência
    const transactionId = crypto.randomUUID();
    currentTransactionId = transactionId;
    const idempotencyKey = crypto.randomUUID();
    const adminDb = createAdminClient();

    logCheckoutProEvent('checkout_pro.preference_transaction_create_started', {
      flowId,
      consultationId,
      transactionId,
      amount: { type: 'number', value: canonicalPrice },
    });

    const { error: insertTxError } = await adminDb.from('payment_transactions').insert({
      id: transactionId,
      consultation_id: consultation.id,
      user_id: user.id,
      status: 'pending',
      payment_method_id: 'checkout_pro',
      payment_type_id: 'checkout_pro',
      transaction_amount: canonicalPrice,
      idempotency_key: idempotencyKey,
      payer_email: user.email,
    });

    if (insertTxError) {
      const normalized = normalizeCheckoutProError(
        new CheckoutProDatabaseError(`Falha ao inserir transação: ${insertTxError.message}`),
      );
      logCheckoutProEvent(
        'checkout_pro.preference_transaction_create_failed',
        {
          flowId,
          consultationId,
          transactionId,
          errorName: normalized.errorName,
          errorOrigin: 'database',
          providerMessageSanitized: normalized.providerMessageSanitized,
        },
        'error',
      );
      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          consultationId,
          transactionId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: 'database',
          providerHttpStatus: 500,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: 0,
        },
        'error',
      );
      return NextResponse.json(
        { success: false, error: normalized.safeClientMessage, code: normalized.safeClientCode },
        { status: 500 },
      );
    }

    logCheckoutProEvent('checkout_pro.preference_transaction_create_succeeded', {
      flowId,
      consultationId,
      transactionId,
    });

    // 7. Construção do corpo da Preferência
    logCheckoutProEvent('checkout_pro.preference_body_build_started', {
      flowId,
      consultationId,
      transactionId,
    });

    const preferenceBody = buildPreferenceBody({
      consultationId: consultation.id,
      transactionId,
      userId: user.id,
      customerEmail: user.email || '',
      unitPrice: canonicalPrice,
      plate: consultation.plate,
    });

    const backUrlsRecord = preferenceBody.back_urls as
      | { success?: string; pending?: string; failure?: string }
      | undefined;

    logCheckoutProEvent('checkout_pro.preference_body_built', {
      flowId,
      consultationId,
      transactionId,
      itemCount: preferenceBody.items?.length || 1,
      itemQuantity: preferenceBody.items?.[0]?.quantity || 1,
      unitPrice: {
        type: 'number',
        value: Number(preferenceBody.items?.[0]?.unit_price || canonicalPrice),
      },
      externalReference: {
        presence: !!preferenceBody.external_reference,
        hashTruncated: truncateHash(preferenceBody.external_reference),
      },
      metadataKeys: preferenceBody.metadata ? Object.keys(preferenceBody.metadata) : [],
      backUrls: {
        presence: !!preferenceBody.back_urls,
        originsAndPaths: backUrlsRecord
          ? {
              success: extractOriginAndPath(backUrlsRecord.success) || '',
              pending: extractOriginAndPath(backUrlsRecord.pending) || '',
              failure: extractOriginAndPath(backUrlsRecord.failure) || '',
            }
          : undefined,
      },
      notificationUrl: {
        presence: !!preferenceBody.notification_url,
        originAndPath: extractOriginAndPath(preferenceBody.notification_url),
      },
      paymentMethodsKeys: preferenceBody.payment_methods
        ? Object.keys(preferenceBody.payment_methods)
        : [],
    });

    // 8. Inicialização do Cliente SDK
    logCheckoutProEvent('checkout_pro.preference_client_initialization_started', {
      flowId,
      consultationId,
      transactionId,
    });

    const credentialMode = getCredentialMode();
    const preferenceClient = getPreferenceClient();
    const envMode = isTestMode() ? 'test' : 'production';

    logCheckoutProEvent('checkout_pro.preference_client_initialization_succeeded', {
      flowId,
      consultationId,
      transactionId,
      credentialMode,
      sdkVersion: SDK_VERSION,
      environment: envMode,
    });

    // 9. Invocação de criação de preferência no Mercado Pago
    logCheckoutProEvent('checkout_pro.preference_create_invoked', {
      flowId,
      consultationId,
      transactionId,
      environment: envMode,
    });

    let preferenceResponse: { id?: string; init_point?: string; sandbox_init_point?: string };

    try {
      preferenceResponse = await preferenceClient.create({ body: preferenceBody });
    } catch (mpError: unknown) {
      const normalized = normalizeCheckoutProError(mpError);

      logCheckoutProEvent(
        'checkout_pro.preference_create_threw',
        {
          flowId,
          consultationId,
          transactionId,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: normalized.providerHttpStatus,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: normalized.causeCount,
        },
        'error',
      );

      // Atualiza a transação local com estado de provider_error e mensagem sanitizada
      logCheckoutProEvent('checkout_pro.preference_transaction_update_started', {
        flowId,
        consultationId,
        transactionId,
      });

      await adminDb
        .from('payment_transactions')
        .update({
          status: 'provider_error',
          failure_code: normalized.safeClientCode,
          failure_message_safe: normalized.safeClientMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      logCheckoutProEvent('checkout_pro.preference_transaction_update_succeeded', {
        flowId,
        consultationId,
        transactionId,
      });

      logCheckoutProEvent(
        'checkout_pro.preference_create_failed',
        {
          flowId,
          consultationId,
          transactionId,
          durationMs: Date.now() - startTime,
          errorName: normalized.errorName,
          errorOrigin: normalized.errorOrigin,
          providerHttpStatus: normalized.providerHttpStatus,
          providerMessageSanitized: normalized.providerMessageSanitized,
          causeCount: normalized.causeCount,
        },
        'error',
      );

      return NextResponse.json(
        {
          success: false,
          error: normalized.safeClientMessage,
          code: normalized.safeClientCode,
        },
        { status: normalized.httpStatus },
      );
    }

    if (!preferenceResponse.id) {
      throw new Error('Mercado Pago não retornou ID de preferência válido.');
    }

    const initPoint = preferenceResponse.init_point || '';
    const sandboxInitPoint = preferenceResponse.sandbox_init_point || '';
    const chosenUrl = isTestMode() && sandboxInitPoint ? sandboxInitPoint : initPoint;

    if (!chosenUrl || !isValidMercadoPagoRedirectUrl(chosenUrl)) {
      throw new Error(`URL de redirecionamento inválida ou não autorizada: ${chosenUrl}`);
    }

    logCheckoutProEvent('checkout_pro.preference_create_succeeded', {
      flowId,
      consultationId,
      transactionId,
      preferenceId: {
        presence: true,
        masked: maskIdentifier(preferenceResponse.id),
      },
      initPoint: {
        presence: true,
        origin: extractOrigin(chosenUrl),
      },
    });

    // 10. Atualização da transação com mp_preference_id
    logCheckoutProEvent('checkout_pro.preference_transaction_update_started', {
      flowId,
      consultationId,
      transactionId,
    });

    await adminDb
      .from('payment_transactions')
      .update({
        mp_preference_id: preferenceResponse.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId);

    // 11. Atualiza referência de latest_payment_transaction_id na consulta
    await adminDb
      .from('customer_plate_consultations')
      .update({
        latest_payment_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', consultation.id);

    // 12. Registra log de auditoria imutável
    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: consultation.id,
      transaction_id: transactionId,
      actor_id: user.id,
      actor_type: 'customer',
      event: 'checkout_pro_preference_created',
      details: {
        preference_id: preferenceResponse.id,
        environment: envMode,
        amount: canonicalPrice,
      },
    });

    logCheckoutProEvent('checkout_pro.preference_transaction_update_succeeded', {
      flowId,
      consultationId,
      transactionId,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      preferenceId: preferenceResponse.id,
      redirectUrl: chosenUrl,
      environment: envMode,
    });
  } catch (error: unknown) {
    const normalized = normalizeCheckoutProError(error);

    logCheckoutProEvent(
      'checkout_pro.preference_create_failed',
      {
        flowId,
        consultationId: currentConsultationId,
        transactionId: currentTransactionId,
        durationMs: Date.now() - startTime,
        errorName: normalized.errorName,
        errorOrigin: normalized.errorOrigin,
        providerHttpStatus: normalized.providerHttpStatus,
        providerMessageSanitized: normalized.providerMessageSanitized,
        causeCount: normalized.causeCount,
      },
      'error',
    );

    return NextResponse.json(
      {
        success: false,
        error: normalized.safeClientMessage,
        code: normalized.safeClientCode,
      },
      { status: normalized.httpStatus },
    );
  }
}

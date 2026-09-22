import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  validateWebhookSignature,
  resolveMercadoPagoWebhookResourceId,
  parseSignatureHeader,
  fetchAuthoritativePayment,
} from '@/lib/mercadopago/webhook-service';
import { confirmAndProcessPaymentTransaction } from '@/lib/mercadopago/payment-processing-service';
import {
  logCheckoutProEvent,
  maskId,
  shortHash,
} from '@/lib/mercadopago/observability';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const flowId = crypto.randomUUID();
  const adminDb = createAdminClient();

  // 1. Extrai dados do corpo e da query de forma resiliente
  let bodyJson: Record<string, unknown> = {};
  let bodyValidJson = true;

  try {
    const rawBody = await request.text();
    if (rawBody && rawBody.trim().length > 0) {
      bodyJson = JSON.parse(rawBody);
    } else {
      bodyJson = {};
    }
  } catch {
    bodyJson = {};
    bodyValidJson = false;
  }

  const { searchParams } = new URL(request.url);

  // Determina a fonte do identificador de recurso para observabilidade
  let resourceIdSource: 'payload.data.id' | 'query.data.id' | 'query.id' | 'missing' = 'missing';
  if ((bodyJson.data as Record<string, unknown>)?.id !== undefined) {
    resourceIdSource = 'payload.data.id';
  } else if (searchParams.get('data.id')) {
    resourceIdSource = 'query.data.id';
  } else if (searchParams.get('id')) {
    resourceIdSource = 'query.id';
  }

  const resourceId = resolveMercadoPagoWebhookResourceId(request, bodyJson);

  const signatureHeader = request.headers.get('x-signature');
  const requestId = request.headers.get('x-request-id');
  const parsedSig = parseSignatureHeader(signatureHeader);

  const eventType = String(
    bodyJson.type ||
      bodyJson.action ||
      searchParams.get('type') ||
      searchParams.get('topic') ||
      'unknown',
  ).toLowerCase();

  const eventId = String(bodyJson.id || searchParams.get('id') || crypto.randomUUID());

  // Log seguro do recebimento do webhook (RF-03)
  logCheckoutProEvent('checkout_pro.webhook_received', {
    flowId,
    httpMethod: 'POST',
    resourceIdSource,
    resourceIdMasked: maskId(resourceId),
    requestIdPresent: Boolean(requestId),
    requestIdHash: shortHash(requestId),
    signaturePresent: Boolean(signatureHeader),
    signatureTsPresent: Boolean(parsedSig.ts),
    signatureV1Present: Boolean(parsedSig.v1),
    signatureV1Length: parsedSig.v1?.length ?? null,
    payloadType: typeof bodyJson.type === 'string' ? bodyJson.type : null,
    payloadAction: typeof bodyJson.action === 'string' ? bodyJson.action : null,
    bodyValidJson,
  });

  // 2. Validação Criptográfica da Assinatura HMAC
  const signatureCheck = validateWebhookSignature(request.headers, resourceId);

  // Emissão do manifesto construído (RF-03)
  logCheckoutProEvent('checkout_pro.webhook_signature_manifest_built', {
    flowId,
    manifestVersion: 'mercadopago-v1-id-request-id-ts',
    manifestHash: signatureCheck.manifestHash ?? null,
    manifestLength: signatureCheck.manifestLength,
    resourceIdSource,
    requestIdPresent: Boolean(requestId),
    timestampPresent: Boolean(parsedSig.ts),
  });

  // Registra o evento recebido na tabela webhook_events para auditoria imediata
  const { data: webhookRecord } = await adminDb
    .from('webhook_events')
    .insert({
      event_id: eventId,
      event_type: eventType,
      action: typeof bodyJson.action === 'string' ? bodyJson.action : null,
      mp_resource_id: resourceId || null,
      signature_valid: signatureCheck.isValid,
      processing_status: 'pending',
      payload: bodyJson,
      headers: {
        'x-request-id': requestId ? shortHash(requestId) : null,
        'x-signature-ts': signatureCheck.timestamp || null,
      },
    })
    .select('id')
    .maybeSingle();

  if (!signatureCheck.isValid) {
    logCheckoutProEvent(
      'checkout_pro.webhook_signature_rejected',
      {
        flowId,
        reasonCode: signatureCheck.reasonCode,
        manifestVersion: 'mercadopago-v1-id-request-id-ts',
        resourceIdMasked: maskId(resourceId),
        receivedDigestLength: signatureCheck.receivedDigestLength,
        expectedDigestLength: signatureCheck.expectedDigestLength,
        errorMessage: signatureCheck.reason,
      },
      'warn',
    );

    if (webhookRecord?.id) {
      await adminDb
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          processing_error: signatureCheck.reason,
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookRecord.id);
    }

    return NextResponse.json(
      { error: 'Assinatura de notificação inválida ou ausente.' },
      { status: 401 },
    );
  }

  logCheckoutProEvent('checkout_pro.webhook_signature_verified', {
    flowId,
    manifestVersion: 'mercadopago-v1-id-request-id-ts',
    resourceIdMasked: maskId(resourceId),
    requestIdHash: shortHash(requestId),
    durationMs: Date.now() - startTime,
  });

  // 3. Deduplicação e Idempotência (RF-05)
  if (resourceId) {
    const { data: existingProcessedEvent } = await adminDb
      .from('webhook_events')
      .select('id')
      .eq('mp_resource_id', resourceId)
      .eq('processing_status', 'processed')
      .neq('id', webhookRecord?.id || crypto.randomUUID())
      .limit(1)
      .maybeSingle();

    if (existingProcessedEvent) {
      logCheckoutProEvent('checkout_pro.webhook_duplicate_ignored', {
        flowId,
        paymentId: resourceId,
      });

      if (webhookRecord?.id) {
        await adminDb
          .from('webhook_events')
          .update({
            processing_status: 'ignored',
            processing_error: 'Evento duplicado já processado anteriormente.',
            processed_at: new Date().toISOString(),
          })
          .eq('id', webhookRecord.id);
      }

      return NextResponse.json({
        received: true,
        status: 'ignored',
        reason: 'duplicate',
      });
    }
  }

  // 4. Filtro por eventos de pagamento
  const isPaymentEvent =
    eventType.includes('payment') ||
    (typeof bodyJson.action === 'string' && bodyJson.action.startsWith('payment'));

  if (!isPaymentEvent) {
    if (webhookRecord?.id) {
      await adminDb
        .from('webhook_events')
        .update({
          processing_status: 'ignored',
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookRecord.id);
    }
    return NextResponse.json({ received: true, status: 'ignored' });
  }

  if (!resourceId) {
    return NextResponse.json({ received: true, status: 'ignored' });
  }

  // 5. Busca Autoritativa do Pagamento na API do Mercado Pago
  let paymentData;
  try {
    logCheckoutProEvent('checkout_pro.payment_fetch_started', {
      flowId,
      paymentId: resourceId,
    });
    paymentData = await fetchAuthoritativePayment(resourceId);
    logCheckoutProEvent('checkout_pro.payment_fetch_succeeded', {
      flowId,
      paymentId: resourceId,
      status: paymentData.status,
      statusDetail: paymentData.statusDetail || undefined,
    });
  } catch (err) {
    const fetchErrMsg = err instanceof Error ? err.message : 'Falha na busca do pagamento';
    logCheckoutProEvent(
      'checkout_pro.payment_fetch_failed',
      {
        flowId,
        paymentId: resourceId,
        errorMessage: fetchErrMsg,
      },
      'error',
    );

    if (webhookRecord?.id) {
      await adminDb
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          processing_error: fetchErrMsg,
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookRecord.id);
    }

    return NextResponse.json(
      { error: 'Falha ao buscar pagamento na API do provedor.' },
      { status: 502 },
    );
  }

  // 6. Localiza a transação correspondente em payment_transactions por resolução em cascata
  let transaction = null;

  // 6a. Resolução por mp_payment_id
  const { data: txByPaymentId } = await adminDb
    .from('payment_transactions')
    .select('*')
    .eq('mp_payment_id', paymentData.id)
    .maybeSingle();

  if (txByPaymentId) {
    transaction = txByPaymentId;
  }

  // 6b. Resolução por external_reference (como id da transação ou credit_package_order_id)
  if (!transaction && paymentData.externalReference) {
    const { data: txByRef } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('id', paymentData.externalReference)
      .maybeSingle();

    if (txByRef) {
      transaction = txByRef;
    } else {
      const { data: txByOrder } = await adminDb
        .from('payment_transactions')
        .select('*')
        .eq('credit_package_order_id', paymentData.externalReference)
        .maybeSingle();

      if (txByOrder) {
        transaction = txByOrder;
      }
    }
  }

  // 6c. Resolução por mp_preference_id (na transação ou no pedido de pacote)
  if (!transaction && paymentData.preferenceId) {
    const { data: txByPref } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('mp_preference_id', paymentData.preferenceId)
      .maybeSingle();

    if (txByPref) {
      transaction = txByPref;
    } else {
      const { data: orderWithPref } = await adminDb
        .from('credit_package_orders')
        .select('payment_transaction_id')
        .eq('mp_preference_id', paymentData.preferenceId)
        .maybeSingle();

      if (orderWithPref?.payment_transaction_id) {
        const { data: txFromOrder } = await adminDb
          .from('payment_transactions')
          .select('*')
          .eq('id', orderWithPref.payment_transaction_id)
          .maybeSingle();

        if (txFromOrder) {
          transaction = txFromOrder;
        }
      }
    }
  }

  // 6d. Resolução por metadata.order_id
  const metadataOrderId =
    typeof paymentData.metadata?.order_id === 'string'
      ? paymentData.metadata.order_id
      : null;

  if (!transaction && metadataOrderId) {
    const { data: txByMetadataOrder } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('credit_package_order_id', metadataOrderId)
      .maybeSingle();

    if (txByMetadataOrder) {
      transaction = txByMetadataOrder;
    }
  }

  if (!transaction) {
    if (webhookRecord?.id) {
      await adminDb
        .from('webhook_events')
        .update({
          processing_status: 'ignored',
          processing_error: 'Transação interna correspondente não encontrada.',
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookRecord.id);
    }
    return NextResponse.json({ received: true, status: 'ignored' });
  }

  // 7. Confirmação Centralizada e Atômica (Compartilhada com Reconcile)
  const confirmationOutcome = await confirmAndProcessPaymentTransaction({
    transaction,
    paymentData,
    actorType: 'webhook',
    flowId,
  });

  if (!confirmationOutcome.success) {
    if (webhookRecord?.id) {
      await adminDb
        .from('webhook_events')
        .update({
          processing_status: 'failed',
          processing_error: confirmationOutcome.error,
          processed_at: new Date().toISOString(),
        })
        .eq('id', webhookRecord.id);
    }

    return NextResponse.json({ error: confirmationOutcome.message }, { status: 422 });
  }

  // 8. Atualiza o status de processamento do evento de webhook
  if (webhookRecord?.id) {
    await adminDb
      .from('webhook_events')
      .update({
        processing_status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', webhookRecord.id);
  }

  return NextResponse.json({
    received: true,
    status: 'processed',
    durationMs: Date.now() - startTime,
  });
}

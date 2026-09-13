import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  validateWebhookSignature,
  fetchAuthoritativePayment,
} from '@/lib/mercadopago/webhook-service';
import { mapMercadoPagoStatus, canTransitionStatus } from '@/lib/mercadopago/payment-status-mapper';
import { releaseVerifiedPaidConsultation } from '@/lib/mercadopago/consultation-releaser';
import { logCheckoutProEvent } from '@/lib/mercadopago/observability';
import { type PaymentTransactionStatus } from '@/lib/mercadopago/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const flowId = crypto.randomUUID();
  const adminDb = createAdminClient();

  logCheckoutProEvent('checkout_pro.webhook_received', { flowId });

  // 1. Extrai dados do corpo e da query
  let bodyJson: Record<string, unknown> = {};
  try {
    bodyJson = (await request.json()) || {};
  } catch {
    bodyJson = {};
  }

  const { searchParams } = new URL(request.url);
  const resourceId = String(
    (bodyJson.data as Record<string, unknown>)?.id ||
      searchParams.get('data.id') ||
      searchParams.get('id') ||
      bodyJson.id ||
      '',
  ).trim();

  const eventType = String(
    bodyJson.type ||
      bodyJson.action ||
      searchParams.get('type') ||
      searchParams.get('topic') ||
      'unknown',
  ).toLowerCase();

  const eventId = String(bodyJson.id || searchParams.get('id') || crypto.randomUUID());

  // 2. Validação Criptográfica da Assinatura HMAC
  const signatureCheck = validateWebhookSignature(request.headers, resourceId);

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
        'x-request-id': request.headers.get('x-request-id'),
        'x-signature-ts': signatureCheck.timestamp,
      },
    })
    .select('id')
    .maybeSingle();

  if (!signatureCheck.isValid) {
    logCheckoutProEvent(
      'checkout_pro.webhook_signature_rejected',
      {
        flowId,
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
    paymentId: resourceId,
  });

  // 3. Filtro por eventos de pagamento
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

  // 4. Busca Autoritativa do Pagamento na API do Mercado Pago
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

  // 5. Localiza a transação correspondente em payment_transactions
  let transaction = null;

  if (paymentData.externalReference) {
    const { data: txByRef } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('id', paymentData.externalReference)
      .maybeSingle();
    transaction = txByRef;
  }

  if (!transaction) {
    const { data: txByPaymentId } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('mp_payment_id', paymentData.id)
      .maybeSingle();
    transaction = txByPaymentId;
  }

  if (!transaction) {
    // Transação não gerada por esta instância da AF Motos ou referência desconhecida
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

  // 6. Normalização e Atualização Atômica de Estado
  const newStatus = mapMercadoPagoStatus(paymentData.status);
  const currentStatus = transaction.status as PaymentTransactionStatus;

  if (canTransitionStatus(currentStatus, newStatus)) {
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

    logCheckoutProEvent('checkout_pro.transaction_updated', {
      flowId,
      transactionId: transaction.id,
      paymentId: paymentData.id,
      status: newStatus,
      statusDetail: paymentData.statusDetail || undefined,
    });
  }

  // 7. Liberação da Consulta Veicular (se verificado como approved)
  if (newStatus === 'approved') {
    await releaseVerifiedPaidConsultation(transaction.id);
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

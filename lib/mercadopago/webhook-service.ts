import crypto from 'crypto';
import { getPaymentClient } from './client.ts';
import { timingSafeCompare } from './security.ts';
import { type WebhookVerificationResult } from './types.ts';

/**
 * Valida a assinatura HMAC-SHA256 de uma requisição de webhook do Mercado Pago.
 * Segue a especificação oficial:
 * manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
 */
export function validateWebhookSignature(
  headers: Headers,
  resourceId: string,
): WebhookVerificationResult {
  const signatureHeader = headers.get('x-signature');
  const requestId = headers.get('x-request-id');
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  if (!secret) {
    return {
      isValid: false,
      reason: 'MERCADO_PAGO_WEBHOOK_SECRET não configurado no servidor.',
    };
  }

  if (!signatureHeader || !requestId) {
    return {
      isValid: false,
      reason: 'Cabeçalhos x-signature ou x-request-id ausentes.',
    };
  }

  if (!resourceId) {
    return {
      isValid: false,
      reason: 'ID do recurso não identificado na notificação.',
    };
  }

  // Extrai ts e v1 do cabeçalho x-signature (ex.: ts=1704067200,v1=abcdef0123456789...)
  const parts = signatureHeader.split(',');
  let ts: string | undefined;
  let v1: string | undefined;

  for (const part of parts) {
    const [key, val] = part.trim().split('=');
    if (key === 'ts') ts = val;
    if (key === 'v1') v1 = val;
  }

  if (!ts || !v1) {
    return {
      isValid: false,
      reason: 'Formato inválido do cabeçalho x-signature (ts ou v1 ausente).',
    };
  }

  // Monta o manifesto oficial
  const manifest = `id:${resourceId};request-id:${requestId};ts:${ts};`;

  // Calcula o hash HMAC-SHA256
  const computedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  // Comparação timing-safe
  const isValid = timingSafeCompare(computedHash, v1);

  return {
    isValid,
    timestamp: ts,
    resourceId,
    reason: isValid ? undefined : 'Assinatura criptográfica não confere.',
  };
}

/**
 * Busca os dados definitivos e autoritativos de um pagamento diretamente na API do Mercado Pago.
 */
export async function fetchAuthoritativePayment(paymentId: string | number) {
  const paymentClient = getPaymentClient();
  const payment = await paymentClient.get({ id: String(paymentId) });

  if (!payment || !payment.id) {
    throw new Error(`Pagamento ${paymentId} não encontrado no Mercado Pago.`);
  }

  return {
    id: String(payment.id),
    status: payment.status || 'pending',
    statusDetail: payment.status_detail || null,
    externalReference: payment.external_reference || null,
    transactionAmount: payment.transaction_amount || 0,
    paymentMethodId: payment.payment_method_id || null,
    paymentTypeId: payment.payment_type_id || null,
    payerEmail: payment.payer?.email || null,
    rawResponse: payment as unknown as Record<string, unknown>,
  };
}

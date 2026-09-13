import crypto from 'crypto';

export interface WebhookFixture {
  description: string;
  resourceId: string;
  requestId: string;
  timestamp: string;
  secret: string;
  signatureHeader: string;
  payload: Record<string, unknown>;
  queryString: string;
}

export const TEST_WEBHOOK_SECRET = 'test_secret_for_mercadopago_signature_validation_987654321';

/**
 * Helper para construir o manifesto oficial e gerar o hash HMAC-SHA256
 */
export function buildOfficialManifest(resourceId: string, requestId: string, ts: string): string {
  return `id:${resourceId};request-id:${requestId};ts:${ts};`;
}

export function computeHmacSha256(manifest: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(manifest, 'utf8').digest('hex');
}

/**
 * Fixture de notificação de pagamento real de produção anonimizada
 * Baseada no caso real: paymentId 177857907601
 */
export function createRealPaymentWebhookFixture(
  customSecret: string = TEST_WEBHOOK_SECRET,
  options?: {
    order?: 'ts_first' | 'v1_first';
    spaces?: boolean;
    extraFields?: boolean;
  },
): WebhookFixture {
  const resourceId = '177857907601';
  const requestId = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
  const timestamp = '1704067200';

  const manifest = buildOfficialManifest(resourceId, requestId, timestamp);
  const v1 = computeHmacSha256(manifest, customSecret);

  let signatureHeader: string;
  if (options?.order === 'v1_first') {
    signatureHeader = options?.spaces
      ? `v1 = ${v1} , ts = ${timestamp}`
      : `v1=${v1},ts=${timestamp}`;
  } else {
    signatureHeader = options?.spaces
      ? `ts = ${timestamp} , v1 = ${v1}`
      : `ts=${timestamp},v1=${v1}`;
  }

  if (options?.extraFields) {
    signatureHeader += ',version=1.0,algo=sha256';
  }

  return {
    description: 'Notificação real de pagamento aprovado do Mercado Pago',
    resourceId,
    requestId,
    timestamp,
    secret: customSecret,
    signatureHeader,
    payload: {
      action: 'payment.created',
      api_version: 'v1',
      data: {
        id: resourceId,
      },
      date_created: '2026-09-13T14:10:00.000Z',
      id: 9876543210,
      live_mode: true,
      type: 'payment',
      user_id: 123456789,
    },
    queryString: `data.id=${resourceId}&type=payment`,
  };
}

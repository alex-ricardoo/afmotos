import crypto from 'crypto';

export interface VerifySignatureParams {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
  secret: string;
}

/**
 * Validates Mercado Pago webhook notifications using HMAC-SHA256 signature.
 *
 * Algorithm per Mercado Pago documentation:
 * 1. Extract `ts` and `v1` from the `x-signature` header.
 * 2. Build the manifest template: `id:[data.id];request-id:[x-request-id];ts:[ts];`
 * 3. Generate HMAC SHA-256 using the webhook secret.
 * 4. Compare generated hash with `v1` using timingSafeEqual to prevent timing attacks.
 */
export function verifyMercadoPagoWebhookSignature(params: VerifySignatureParams): boolean {
  const { xSignature, xRequestId, dataId, secret } = params;

  if (!xSignature || !secret || !dataId) {
    return false;
  }

  const parts = xSignature.split(',');
  let ts = '';
  let v1 = '';

  for (const part of parts) {
    const [key, val] = part.trim().split('=');
    if (key === 'ts') ts = val;
    if (key === 'v1') v1 = val;
  }

  if (!ts || !v1) {
    return false;
  }

  // Manifest template: id:url_id;request-id:header_req_id;ts:header_ts;
  const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;

  try {
    const hmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const hmacBuffer = Buffer.from(hmac, 'hex');
    const v1Buffer = Buffer.from(v1, 'hex');

    if (hmacBuffer.length !== v1Buffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hmacBuffer, v1Buffer);
  } catch (err) {
    console.error('[verifyMercadoPagoWebhookSignature] Error verifying HMAC:', err);
    return false;
  }
}

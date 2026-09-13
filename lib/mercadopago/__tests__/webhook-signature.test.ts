import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { validateWebhookSignature } from '../webhook-service.ts';
import {
  isValidMercadoPagoRedirectUrl,
  maskEmail,
  maskCpf,
  maskIdentifier,
  timingSafeCompare,
} from '../security.ts';

describe('Mercado Pago Security & Webhook Signature', () => {
  const secret = 'test-webhook-secret-key-12345';
  process.env.MERCADO_PAGO_WEBHOOK_SECRET = secret;

  it('validates a genuine HMAC-SHA256 signature correctly', () => {
    const resourceId = '9988776655';
    const requestId = 'req-uuid-123456';
    const ts = '1704067200';

    const manifest = `id:${resourceId};request-id:${requestId};ts:${ts};`;
    const v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    const headers = new Headers({
      'x-signature': `ts=${ts},v1=${v1}`,
      'x-request-id': requestId,
    });

    const res = validateWebhookSignature(headers, resourceId);
    assert.equal(res.isValid, true);
    assert.equal(res.timestamp, ts);
    assert.equal(res.resourceId, resourceId);
  });

  it('rejects an invalid signature hash', () => {
    const resourceId = '9988776655';
    const headers = new Headers({
      'x-signature': 'ts=1704067200,v1=tamperedhash1234567890abcdef',
      'x-request-id': 'req-uuid-123456',
    });

    const res = validateWebhookSignature(headers, resourceId);
    assert.equal(res.isValid, false);
    assert.match(res.reason || '', /não confere/i);
  });

  it('rejects when headers are missing', () => {
    const headers = new Headers();
    const res = validateWebhookSignature(headers, '12345');
    assert.equal(res.isValid, false);
    assert.match(res.reason || '', /ausentes/i);
  });

  it('validates official Mercado Pago redirect hosts', () => {
    assert.equal(
      isValidMercadoPagoRedirectUrl(
        'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      ),
      true,
    );
    assert.equal(
      isValidMercadoPagoRedirectUrl(
        'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=123',
      ),
      true,
    );
    assert.equal(isValidMercadoPagoRedirectUrl('https://mercadopago.com/checkout/123'), true);
  });

  it('rejects unauthorized or malicious redirect URLs', () => {
    assert.equal(isValidMercadoPagoRedirectUrl('http://www.mercadopago.com.br/test'), false);
    assert.equal(
      isValidMercadoPagoRedirectUrl('https://mercadopago.com.br.attacker.com/checkout'),
      false,
    );
    assert.equal(isValidMercadoPagoRedirectUrl('https://evil-site.com/mercadopago'), false);
    assert.equal(isValidMercadoPagoRedirectUrl('javascript:alert(1)'), false);
    assert.equal(isValidMercadoPagoRedirectUrl(''), false);
  });

  it('masks sensitive customer data properly for logs', () => {
    assert.equal(maskEmail('cliente@example.com'), 'c***e@example.com');
    assert.equal(maskEmail(null), '[NO_EMAIL]');
    assert.equal(maskCpf('12345678901'), '***.456.***-01');
    assert.equal(maskCpf(null), '[NO_CPF]');
    assert.equal(maskIdentifier('1234567890abcdef'), '1234...cdef');
  });

  it('performs timing-safe string comparison', () => {
    assert.equal(timingSafeCompare('secret-token', 'secret-token'), true);
    assert.equal(timingSafeCompare('secret-token', 'wrong-token'), false);
    assert.equal(timingSafeCompare('short', 'longer-string'), false);
  });
});

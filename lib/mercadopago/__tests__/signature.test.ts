import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { verifyMercadoPagoWebhookSignature } from '../signature.ts';

describe('Mercado Pago Webhook Signature Verification', () => {
  const secret = 'test_webhook_secret_key_12345';
  const dataId = '9876543210';
  const xRequestId = 'test-request-id-abc';
  const ts = '1710000000';

  it('validates a legitimate HMAC signature correctly', () => {
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const validHmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const xSignature = `ts=${ts},v1=${validHmac}`;

    const isValid = verifyMercadoPagoWebhookSignature({
      xSignature,
      xRequestId,
      dataId,
      secret,
    });

    assert.equal(isValid, true);
  });

  it('rejects an invalid HMAC signature', () => {
    const fakeSignature = `ts=${ts},v1=deadbeefcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabe`;

    const isValid = verifyMercadoPagoWebhookSignature({
      xSignature: fakeSignature,
      xRequestId,
      dataId,
      secret,
    });

    assert.equal(isValid, false);
  });

  it('rejects when timestamp is manipulated', () => {
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const validHmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    // Altered timestamp in header
    const alteredSignature = `ts=1799999999,v1=${validHmac}`;

    const isValid = verifyMercadoPagoWebhookSignature({
      xSignature: alteredSignature,
      xRequestId,
      dataId,
      secret,
    });

    assert.equal(isValid, false);
  });

  it('rejects when dataId is mismatched', () => {
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const validHmac = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    const xSignature = `ts=${ts},v1=${validHmac}`;

    const isValid = verifyMercadoPagoWebhookSignature({
      xSignature,
      xRequestId,
      dataId: 'different_resource_id',
      secret,
    });

    assert.equal(isValid, false);
  });

  it('returns false gracefully when headers or secret are missing', () => {
    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: null,
        xRequestId,
        dataId,
        secret,
      }),
      false,
    );

    assert.equal(
      verifyMercadoPagoWebhookSignature({
        xSignature: 'ts=123,v1=abc',
        xRequestId,
        dataId,
        secret: '',
      }),
      false,
    );
  });
});

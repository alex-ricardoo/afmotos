import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { maskEmail, maskCpfMeta, sanitizeContext, extractSafeError } from '../payment-logger.ts';

describe('Payment Logger Privacy & Sanitization', () => {
  it('should mask email addresses correctly', () => {
    assert.equal(maskEmail('alex.ricardo1999@hotmail.com'), 'al***@hotmail.com');
    assert.equal(maskEmail('jo@gmail.com'), 'j***@gmail.com');
    assert.equal(maskEmail('a@test.com'), 'a***@test.com');
    assert.equal(maskEmail(''), undefined);
    assert.equal(maskEmail(null), undefined);
  });

  it('should mask CPF into metadata only without storing numbers', () => {
    const meta = maskCpfMeta('123.456.789-00');
    assert.equal(meta.cpfPresent, true);
    assert.equal(meta.cpfLength, 11);

    const emptyMeta = maskCpfMeta(null);
    assert.equal(emptyMeta.cpfPresent, false);
    assert.equal(emptyMeta.cpfLength, 0);
  });

  it('should strictly strip all forbidden keys and secrets', () => {
    const unsafe = {
      token: 'tok_abc123',
      card_token: 'secret_card_token',
      card_number: '4111111111111111',
      cvv: '123',
      security_code: '999',
      mp_access_token: 'TEST-xxxxxx',
      mercado_pago_access_token: 'APP_USR-xxxx',
      webhook_secret: 'secret_webhook_123',
      authorization: 'Bearer secret_token',
      x_signature: 'ts=123,v1=456',
      street_name: 'Av Paulista',
      street_number: '1000',
      userEmail: 'cliente@teste.com',
      flowId: 'flow-123',
      amount: 49.9,
    };

    const sanitized = sanitizeContext(unsafe);

    // Forbidden keys removed
    assert.equal(sanitized.token, undefined);
    assert.equal(sanitized.card_token, undefined);
    assert.equal(sanitized.card_number, undefined);
    assert.equal(sanitized.cvv, undefined);
    assert.equal(sanitized.security_code, undefined);
    assert.equal(sanitized.mp_access_token, undefined);
    assert.equal(sanitized.mercado_pago_access_token, undefined);
    assert.equal(sanitized.webhook_secret, undefined);
    assert.equal(sanitized.authorization, undefined);
    assert.equal(sanitized.street_name, undefined);
    assert.equal(sanitized.street_number, undefined);

    // Email masked
    assert.equal(sanitized.userEmail, 'cl***@teste.com');

    // Safe fields preserved
    assert.equal(sanitized.flowId, 'flow-123');
    assert.equal(sanitized.amount, 49.9);
  });

  it('should normalize Mercado Pago provider error into safe summary', () => {
    const errorWithCauses = Object.assign(new Error('internal_error'), {
      status: 500,
      error: 'internal_error',
      causes: [
        { code: 2001, description: 'Invalid token' },
        { code: 3001, description: 'Card issuer unavailable' },
      ],
    });

    const safe = extractSafeError(errorWithCauses);
    assert.equal(safe.providerStatus, 500);
    assert.equal(safe.providerMessage, 'internal_error');
    assert.equal(safe.providerError, 'internal_error');
    assert.equal(safe.causeCount, 2);
    assert.deepEqual(safe.causesSummary, [
      'code:2001 desc:Invalid token',
      'code:3001 desc:Card issuer unavailable',
    ]);
  });
});

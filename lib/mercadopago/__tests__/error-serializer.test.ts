import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serializeMercadoPagoError } from '../error-serializer.ts';

describe('Mercado Pago Error Serializer (LGPD & Security)', () => {
  it('T01: should serialize JSON error object thrown by Mercado Pago SDK', () => {
    const sdkError = {
      message: 'The payment cannot be refunded because funds are pending',
      error: 'bad_request',
      status: 400,
      cause: [
        {
          code: 2001,
          description: 'Payment is not refundable in current state',
        },
      ],
    };

    const result = serializeMercadoPagoError(sdkError);
    assert.equal(result.provider, 'mercadopago');
    assert.equal(result.httpStatus, 400);
    assert.equal(result.errorMessage, 'The payment cannot be refunded because funds are pending');
    assert.equal(result.apiCode, 'bad_request');
    assert.equal(result.causeCode, '2001');
    assert.equal(result.causeMessage, 'Payment is not refundable in current state');
    assert.equal(result.retryable, false);
    assert.ok(!result.errorMessage.includes('[object Object]'));
  });

  it('T02: should handle empty or unstructured objects with fallback message and hash', () => {
    const rawUnknown = {};
    const result = serializeMercadoPagoError(rawUnknown);

    assert.equal(result.provider, 'mercadopago');
    assert.equal(result.httpStatus, null);
    assert.equal(
      result.errorMessage,
      'Mercado Pago refund failed without structured provider details',
    );
    assert.ok(typeof result.errorHash === 'string' && result.errorHash.length > 0);
    assert.ok(!result.errorMessage.includes('[object Object]'));
  });

  it('T03: should never output [object Object] even if message was converted to [object Object]', () => {
    const weirdError = {
      message: '[object Object]',
      status: 500,
    };

    const result = serializeMercadoPagoError(weirdError);
    assert.notEqual(result.errorMessage, '[object Object]');
    assert.equal(result.httpStatus, 500);
    assert.equal(result.retryable, true);
  });

  it('T04: should sanitize Mercado Pago access tokens, bearer tokens and sensitive numbers', () => {
    const leakyError = {
      message: 'Invalid credential APP_USR-123456789-abcdef-987654 for Bearer APP_USR-999',
      status: 401,
      cause: [
        {
          code: 'UNAUTHORIZED',
          description: 'Token APP_USR-123456789-abcdef-987654 is expired for client 123.456.789-00',
        },
      ],
    };

    const result = serializeMercadoPagoError(leakyError);
    assert.ok(!result.errorMessage?.includes('APP_USR-123456789-abcdef-987654'));
    assert.ok(result.errorMessage?.includes('[REDACTED_ACCESS_TOKEN]'));
    assert.ok(!result.causeMessage?.includes('123.456.789-00'));
    assert.ok(result.causeMessage?.includes('[REDACTED_CPF]'));
  });

  it('T05: should identify network timeout errors as retryable', () => {
    const timeoutError = new Error('connect ETIMEDOUT 10.0.0.1:443');
    const result = serializeMercadoPagoError(timeoutError);

    assert.equal(result.retryable, true);
    assert.equal(result.errorName, 'Error');
    assert.ok(result.errorMessage?.includes('ETIMEDOUT'));
  });

  it('T06: should mask x-request-id correctly', () => {
    const errorWithRequestId = {
      message: 'Service unavailable',
      status: 503,
      headers: {
        'x-request-id': 'req-9876543210-abcdef',
      },
    };

    const result = serializeMercadoPagoError(errorWithRequestId);
    assert.equal(result.requestIdMasked, 'req-...cdef');
    assert.equal(result.retryable, true);
  });

  it('T07: should handle null and undefined safely', () => {
    const nullRes = serializeMercadoPagoError(null);
    assert.equal(nullRes.provider, 'mercadopago');
    assert.equal(nullRes.retryable, false);

    const undefRes = serializeMercadoPagoError(undefined);
    assert.equal(undefRes.provider, 'mercadopago');
  });
});
